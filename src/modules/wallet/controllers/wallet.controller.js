const Wallet = require("../../../models/Wallet");
const Transaction = require("../../../models/Transaction");
const WithdrawRequest = require("../../../models/WithdrawRequest");
const AuditLog = require("../../../models/AuditLog");

function isAdmin(user) {
  return ["super_admin", "admin", "finance_admin", "operations_admin"].includes(
    user?.role
  );
}

function isPartner(user) {
  return ["partner_owner", "partner_staff", "partner"].includes(user?.role);
}

function canAccessPartnerWallet(user, partnerId) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  if (isPartner(user)) {
    return String(user.partnerId) === String(partnerId);
  }

  return false;
}

async function getWallets(req, res) {
  try {
    const { ownerType, partnerId, status } = req.query;
    const filter = {};

    if (isAdmin(req.user)) {
      if (ownerType) filter.ownerType = ownerType;
      if (partnerId) filter.partnerId = partnerId;
      if (status) filter.status = status;
    }

    if (isPartner(req.user)) {
      filter.partnerId = req.user.partnerId;
      filter.ownerType = "partner";
    }

    const wallets = await Wallet.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: wallets.length,
      data: wallets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar carteiras.",
      error: error.message,
    });
  }
}

async function getWalletByPartner(req, res) {
  try {
    if (!canAccessPartnerWallet(req.user, req.params.partnerId)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    const wallet = await Wallet.findOne({
      partnerId: req.params.partnerId,
      ownerType: "partner",
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Carteira não encontrada.",
      });
    }

    return res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar carteira.",
      error: error.message,
    });
  }
}

async function updateBankAccount(req, res) {
  try {
    if (!canAccessPartnerWallet(req.user, req.params.partnerId)) {
      return res.status(403).json({
        success: false,
        message: "Você não pode alterar esta conta bancária.",
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      {
        partnerId: req.params.partnerId,
        ownerType: "partner",
      },
      {
        bankAccount: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Carteira não encontrada.",
      });
    }

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: "update_bank_account",
      module: "wallet",
      targetType: "wallet",
      targetId: wallet._id,
      description: "Dados bancários atualizados.",
      severity: "critical",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: {
        partnerId: req.params.partnerId,
      },
    });

    return res.json({
      success: true,
      message: "Dados bancários atualizados.",
      data: wallet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar dados bancários.",
      error: error.message,
    });
  }
}

async function listTransactions(req, res) {
  try {
    const { walletId, ownerType, status, type } = req.query;
    const filter = {};

    if (isAdmin(req.user)) {
      if (walletId) filter.walletId = walletId;
      if (ownerType) filter.ownerType = ownerType;
    }

    if (isPartner(req.user)) {
      filter.ownerId = req.user.partnerId;
      filter.ownerType = "partner";
    }

    if (status) filter.status = status;
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar transações.",
      error: error.message,
    });
  }
}

async function requestWithdraw(req, res) {
  try {
    const requestedPartnerId = req.body.partnerId;

    if (!canAccessPartnerWallet(req.user, requestedPartnerId)) {
      return res.status(403).json({
        success: false,
        message: "Você não pode solicitar saque desta carteira.",
      });
    }

    const { amount } = req.body;

    const wallet = await Wallet.findOne({
      partnerId: requestedPartnerId,
      ownerType: "partner",
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Carteira não encontrada.",
      });
    }

    if (wallet.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Carteira bloqueada ou em análise.",
      });
    }

    if (!wallet.bankAccount?.pixKey || !wallet.bankAccount?.documentNumber) {
      return res.status(400).json({
        success: false,
        message: "Dados bancários incompletos.",
      });
    }

    if (wallet.bankAccount.pixKeyType !== "cnpj") {
      return res.status(400).json({
        success: false,
        message: "Pix obrigatório deve ser CNPJ.",
      });
    }

    if (amount <= 0 || amount > wallet.balance) {
      return res.status(400).json({
        success: false,
        message: "Valor inválido ou saldo insuficiente.",
      });
    }

    const fee = 0;
    const netAmount = amount;

    wallet.balance -= amount;
    wallet.pendingBalance += amount;

    await wallet.save();

    const transaction = await Transaction.create({
      walletId: wallet._id,
      ownerType: "partner",
      ownerId: requestedPartnerId,
      type: "withdraw_request",
      amount,
      status: "pending",
      description: "Solicitação de saque criada.",
    });

    const withdraw = await WithdrawRequest.create({
      partnerId: requestedPartnerId,
      walletId: wallet._id,
      transactionId: transaction._id,
      amount,
      fee,
      netAmount,
      bankSnapshot: wallet.bankAccount,
      status: "pending_review",
    });

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "partner_owner",
      actorName: req.user?.name || "Parceiro",
      action: "request_withdraw",
      module: "wallet",
      targetType: "withdraw",
      targetId: withdraw._id,
      description: `Saque solicitado no valor de R$ ${amount}.`,
      severity: "critical",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: {
        partnerId: requestedPartnerId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Saque solicitado com sucesso.",
      data: {
        withdraw,
        transaction,
        wallet,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao solicitar saque.",
      error: error.message,
    });
  }
}

module.exports = {
  getWallets,
  getWalletByPartner,
  updateBankAccount,
  listTransactions,
  requestWithdraw,
};