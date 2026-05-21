const Offer = require("../../../models/Offer");
const Partner = require("../../../models/Partner");
const AuditLog = require("../../../models/AuditLog");

function isAdmin(user) {
  return ["super_admin", "admin", "operations_admin", "support"].includes(
    user?.role
  );
}

function hasPartnerOwnership(user, partnerId) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  if (["partner_owner", "partner_staff", "partner"].includes(user.role)) {
    return String(user.partnerId) === String(partnerId);
  }

  return false;
}

async function createOffer(req, res) {
  try {
    const partner = await Partner.findById(req.body.partnerId);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado.",
      });
    }

    if (!hasPartnerOwnership(req.user, partner._id)) {
      return res.status(403).json({
        success: false,
        message: "Você não pode criar oferta para este parceiro.",
      });
    }

    const offer = await Offer.create(req.body);

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: "create_offer",
      module: "offers",
      targetType: "offer",
      targetId: offer._id,
      description: `Oferta ${offer.title} criada para ${partner.companyName}.`,
      severity: "info",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: {
        partnerId: partner._id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Oferta criada com sucesso.",
      data: offer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao criar oferta.",
      error: error.message,
    });
  }
}

async function listOffers(req, res) {
  try {
    const {
      category,
      offerType,
      avityMode,
      partnerId,
      specialty,
      active,
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (offerType) filter.offerType = offerType;
    if (avityMode) filter.avityMode = avityMode;
    if (partnerId) filter.partnerId = partnerId;
    if (specialty) filter.specialty = specialty;
    if (active !== undefined) filter.isActive = active === "true";

    const offers = await Offer.find(filter)
      .populate(
        "partnerId",
        "companyName tradeName partnerType status isOnline address location rating"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar ofertas.",
      error: error.message,
    });
  }
}

async function getOfferById(req, res) {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "partnerId",
      "companyName tradeName partnerType status isOnline address location rating"
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Oferta não encontrada.",
      });
    }

    return res.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar oferta.",
      error: error.message,
    });
  }
}

async function updateOffer(req, res) {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Oferta não encontrada.",
      });
    }

    if (!hasPartnerOwnership(req.user, offer.partnerId)) {
      return res.status(403).json({
        success: false,
        message: "Você não pode editar esta oferta.",
      });
    }

    Object.assign(offer, req.body);
    await offer.save();

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: "update_offer",
      module: "offers",
      targetType: "offer",
      targetId: offer._id,
      description: `Oferta ${offer.title} atualizada.`,
      severity: "warning",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: {
        partnerId: offer.partnerId,
      },
    });

    return res.json({
      success: true,
      message: "Oferta atualizada com sucesso.",
      data: offer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar oferta.",
      error: error.message,
    });
  }
}

async function toggleOfferStatus(req, res) {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Oferta não encontrada.",
      });
    }

    if (!hasPartnerOwnership(req.user, offer.partnerId)) {
      return res.status(403).json({
        success: false,
        message: "Você não pode alterar esta oferta.",
      });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: offer.isActive ? "activate_offer" : "deactivate_offer",
      module: "offers",
      targetType: "offer",
      targetId: offer._id,
      description: offer.isActive
        ? `Oferta ${offer.title} ativada.`
        : `Oferta ${offer.title} desativada.`,
      severity: "warning",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: {
        partnerId: offer.partnerId,
      },
    });

    return res.json({
      success: true,
      message: offer.isActive ? "Oferta ativada." : "Oferta desativada.",
      data: offer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao alterar status da oferta.",
      error: error.message,
    });
  }
}

module.exports = {
  createOffer,
  listOffers,
  getOfferById,
  updateOffer,
  toggleOfferStatus,
};