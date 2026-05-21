const Wallet = require("../../../models/Wallet");
const PayoutBatch = require("../../../models/PayoutBatch");
const PayoutItem = require("../../../models/PayoutItem");
const Transaction = require("../../../models/Transaction");
const AuditLog = require("../../../models/AuditLog");

function isFinanceAdmin(user) {
  return [
    "super_admin",
    "admin",
    "finance_admin",
    "operations_admin",
  ].includes(user?.role);
}

function assertFinanceAccess(req, res) {
  if (!isFinanceAdmin(req.user)) {
    res.status(403).json({
      success: false,
      message: "Acesso restrito ao financeiro.",
    });
    return false;
  }

  return true;
}

async function createPayoutBatch(req, res) {
  try {
    if (!assertFinanceAccess(req, res)) return;

    const { cycleDate, notes } = req.body;

    const wallets = await Wallet.find({
      ownerType: "partner",
      status: "active",
      balance: { $gt: 0 },
    });

    if (!wallets.length) {
      return res.status(400).json({
        success: false,
        message: "Nenhuma carteira com saldo disponível.",
      });
    }

    const totalAmount = wallets.reduce(
      (sum, wallet) => sum + wallet.balance,
      0
    );

    const batch = await PayoutBatch.create({
      cycleDate: cycleDate ? new Date(cycleDate) : new Date(),
      status: "pending_review",
      totalPartners: wallets.length,
      totalAmount,
      createdBy: req.user.id,
      notes: notes || "Ciclo mensal dia 15.",
    });

    const items = [];

    for (const wallet of wallets) {
      const item = await PayoutItem.create({
        batchId: batch._id,
        partnerId: wallet.partnerId,
        walletId: wallet._id,
        amount: wallet.balance,
        status: "pending_review",
        bankSnapshot: wallet.bankAccount,
        notes: "Aguardando aprovação.",
      });

      items.push(item);
    }

    await AuditLog.create({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      actorName: req.user.name,
      action: "create_payout_batch",
      module: "finance",
      targetType: "payout_batch",
      targetId: batch._id,
      description: `Lote criado com ${wallets.length} parceiros.`,
      severity: "critical",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Lote criado com sucesso.",
      data: {
        batch,
        items,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao criar lote.",
      error: error.message,
    });
  }
}

async function listPayoutBatches(req, res) {
  try {
    if (!assertFinanceAccess(req, res)) return;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const batches = await PayoutBatch.find(filter).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar lotes.",
      error: error.message,
    });
  }
}

async function getPayoutBatchById(req, res) {
  try {
    if (!assertFinanceAccess(req, res)) return;

    const batch = await PayoutBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Lote não encontrado.",
      });
    }

    const items = await PayoutItem.find({
      batchId: batch._id,
    })
      .populate("partnerId", "companyName tradeName email")
      .populate("walletId", "balance bankAccount status");

    return res.json({
      success: true,
      data: {
        batch,
        items,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar lote.",
      error: error.message,
    });
  }
}

async function approvePayoutBatch(req, res) {
  try {
    if (!assertFinanceAccess(req, res)) return;

    const batch = await PayoutBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Lote não encontrado.",
      });
    }

    if (batch.status !== "pending_review") {
      return res.status(400).json({
        success: false,
        message: "Lote inválido para aprovação.",
      });
    }

    batch.status = "approved";
    batch.approvedBy = req.user.id;
    batch.approvedAt = new Date();

    await batch.save();

    await PayoutItem.updateMany(
      {
        batchId: batch._id,
        status: "pending_review",
      },
      {
        status: "approved",
      }
    );

    await AuditLog.create({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      actorName: req.user.name,
      action: "approve_payout_batch",
      module: "finance",
      targetType: "payout_batch",
      targetId: batch._id,
      description: "Lote aprovado.",
      severity: "critical",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Lote aprovado.",
      data: batch,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao aprovar lote.",
      error: error.message,
    });
  }
}

async function markPayoutBatchAsPaid(req, res) {
  try {
    if (!assertFinanceAccess(req, res)) return;

    const batch = await PayoutBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Lote não encontrado.",
      });
    }

    if (batch.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Lote precisa estar aprovado.",
      });
    }

    const items = await PayoutItem.find({
      batchId: batch._id,
      status: "approved",
    });

    for (const item of items) {
      const wallet = await Wallet.findById(item.walletId);

      if (!wallet) continue;

      if (wallet.balance < item.amount) continue;

      wallet.balance -= item.amount;
      await wallet.save();

      await Transaction.create({
        walletId: wallet._id,
        ownerType: "partner",
        ownerId: item.partnerId,
        type: "withdraw_paid",
        amount: item.amount,
        status: "completed",
        description: "Repasse pago.",
        processedAt: new Date(),
      });

      item.status = "paid";
      item.paidAt = new Date();
      await item.save();
    }

    batch.status = "paid";
    batch.paidAt = new Date();
    await batch.save();

    await AuditLog.create({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      actorName: req.user.name,
      action: "mark_payout_batch_paid",
      module: "finance",
      targetType: "payout_batch",
      targetId: batch._id,
      description: "Lote marcado como pago.",
      severity: "critical",
    });

    return res.json({
      success: true,
      message: "Lote pago com sucesso.",
      data: batch,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao pagar lote.",
      error: error.message,
    });
  }
}

module.exports = {
  createPayoutBatch,
  listPayoutBatches,
  getPayoutBatchById,
  approvePayoutBatch,
  markPayoutBatchAsPaid,
};