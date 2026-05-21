const Partner = require("../../../models/Partner");
const Wallet = require("../../../models/Wallet");
const AuditLog = require("../../../models/AuditLog");

function isAdmin(user) {
  return [
    "super_admin",
    "admin",
    "operations_admin",
    "support",
  ].includes(user?.role);
}

function isPartnerUser(user) {
  return ["partner_owner", "partner_staff", "partner"].includes(user?.role);
}

function canAccessPartner(user, partnerId) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  if (isPartnerUser(user)) {
    return String(user.partnerId) === String(partnerId);
  }

  return false;
}

async function createPartner(req, res) {
  try {
    const partner = await Partner.create(req.body);

    await Wallet.create({
      ownerType: "partner",
      ownerId: partner._id,
      partnerId: partner._id,
      balance: 0,
      pendingBalance: 0,
      blockedBalance: 0,
      status: "active",
    });

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: "create_partner",
      module: "partners",
      targetType: "partner",
      targetId: partner._id,
      description: `Parceiro ${partner.companyName} cadastrado.`,
      severity: "info",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Parceiro cadastrado com sucesso.",
      data: partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao cadastrar parceiro.",
      error: error.message,
    });
  }
}

async function listPartners(req, res) {
  try {
    const { type, status, city } = req.query;
    const filter = {};

    if (type) filter.partnerType = type;
    if (status) filter.status = status;
    if (city) filter["address.city"] = city;

    if (isPartnerUser(req.user)) {
      filter._id = req.user.partnerId;
    }

    const partners = await Partner.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: partners.length,
      data: partners,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar parceiros.",
      error: error.message,
    });
  }
}

async function getPartnerById(req, res) {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado.",
      });
    }

    if (!canAccessPartner(req.user, partner._id)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    return res.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar parceiro.",
      error: error.message,
    });
  }
}

async function updatePartner(req, res) {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado.",
      });
    }

    if (!canAccessPartner(req.user, partner._id)) {
      return res.status(403).json({
        success: false,
        message: "Você não pode editar este parceiro.",
      });
    }

    Object.assign(partner, req.body);
    await partner.save();

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: "update_partner",
      module: "partners",
      targetType: "partner",
      targetId: partner._id,
      description: `Parceiro ${partner.companyName} atualizado.`,
      severity: "warning",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Parceiro atualizado com sucesso.",
      data: partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar parceiro.",
      error: error.message,
    });
  }
}

async function approvePartner(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Somente administradores podem aprovar parceiros.",
      });
    }

    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado.",
      });
    }

    partner.status = "approved";
    await partner.save();

    await AuditLog.create({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      actorName: req.user.name,
      action: "approve_partner",
      module: "partners",
      targetType: "partner",
      targetId: partner._id,
      description: `Parceiro ${partner.companyName} aprovado.`,
      severity: "critical",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Parceiro aprovado com sucesso.",
      data: partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao aprovar parceiro.",
      error: error.message,
    });
  }
}

async function suspendPartner(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Somente administradores podem suspender parceiros.",
      });
    }

    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado.",
      });
    }

    partner.status = "suspended";
    partner.isOnline = false;
    await partner.save();

    await AuditLog.create({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      actorName: req.user.name,
      action: "suspend_partner",
      module: "partners",
      targetType: "partner",
      targetId: partner._id,
      description: `Parceiro ${partner.companyName} suspenso.`,
      severity: "critical",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Parceiro suspenso com sucesso.",
      data: partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao suspender parceiro.",
      error: error.message,
    });
  }
}

async function setPartnerOnlineStatus(req, res) {
  try {
    const { isOnline } = req.body;

    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado.",
      });
    }

    if (!canAccessPartner(req.user, partner._id)) {
      return res.status(403).json({
        success: false,
        message: "Você não pode alterar este parceiro.",
      });
    }

    if (partner.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Somente parceiros aprovados podem ficar online.",
      });
    }

    partner.isOnline = isOnline;
    await partner.save();

    await AuditLog.create({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      actorName: req.user.name,
      action: isOnline ? "partner_online" : "partner_offline",
      module: "partners",
      targetType: "partner",
      targetId: partner._id,
      description: isOnline
        ? `Parceiro ${partner.companyName} ficou online.`
        : `Parceiro ${partner.companyName} ficou offline.`,
      severity: "info",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Status online atualizado.",
      data: partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar status online.",
      error: error.message,
    });
  }
}

module.exports = {
  createPartner,
  listPartners,
  getPartnerById,
  updatePartner,
  approvePartner,
  suspendPartner,
  setPartnerOnlineStatus,
};