const Request = require("../../../models/Request");
const Offer = require("../../../models/Offer");
const Partner = require("../../../models/Partner");
const Appointment = require("../../../models/Appointment");
const AuditLog = require("../../../models/AuditLog");
const { calculatePlatformFee } = require("../../../services/feeEngine");
const { getSocket } = require("../../../socket/socket");

const {
  createNotification,
} = require("../../notifications/services/notification.service");

function isAdmin(user) {
  return ["super_admin", "admin", "operations_admin", "support"].includes(
    user?.role
  );
}

function hasRequestAccess(user, request) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  if (user.role === "patient") {
    return String(request.patientId) === String(user.id);
  }

  if (["partner_owner", "partner_staff", "partner"].includes(user.role)) {
    return String(request.partnerId) === String(user.partnerId);
  }

  return false;
}

function canPartnerRespond(user, request) {
  if (!user) return false;

  if (["super_admin", "admin", "operations_admin"].includes(user.role)) {
    return true;
  }

  if (["partner_owner", "partner_staff", "partner"].includes(user.role)) {
    return String(request.partnerId) === String(user.partnerId);
  }

  return false;
}

async function createRequest(req, res) {
  try {
    const {
      patientId,
      offerId,
      offerValue,
      preferredDate,
      preferredTime,
      patientLocation,
      notes,
    } = req.body;

    const finalPatientId =
      req.user?.role === "patient" ? req.user.id : patientId;

    if (!finalPatientId) {
      return res.status(400).json({
        success: false,
        message: "patientId é obrigatório.",
      });
    }

    const offer = await Offer.findById(offerId);

    if (!offer || !offer.isActive) {
      return res.status(404).json({
        success: false,
        message: "Oferta não encontrada ou inativa.",
      });
    }

    const partner = await Partner.findById(offer.partnerId);

    if (!partner || partner.status !== "approved" || !partner.isOnline) {
      return res.status(400).json({
        success: false,
        message: "Parceiro indisponível.",
      });
    }

    let status = "waiting_partner_response";
    let finalValue = offerValue || offer.basePrice;

    const canAutoAccept =
      offer.acceptsAutoAccept &&
      offerValue >= offer.autoAcceptMinValue &&
      partner.autoAcceptEnabled;

    if (canAutoAccept) {
      status = "auto_accepted";
      finalValue = offerValue;
    }

    const request = await Request.create({
      patientId: finalPatientId,
      partnerId: partner._id,
      offerId: offer._id,
      category: offer.category,
      requestType:
        offer.avityMode === "negocia" ? "negotiation" : offer.offerType,
      avityMode: offer.avityMode,
      specialty: offer.specialty,
      offerValue,
      finalValue,
      urgent: offer.offerType === "urgent_care",
      status,
      preferredDate,
      preferredTime,
      patientLocation,
      notes,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      respondedAt: canAutoAccept ? new Date() : null,
    });

    await createNotification({
      partnerId: partner._id,
      audience: "partner",
      type: "request_created",
      title: "Nova solicitação",
      message: `Nova solicitação para ${offer.title}.`,
      metadata: {
        requestId: request._id,
        offerId: offer._id,
      },
    });

    let appointment = null;

    if (status === "auto_accepted") {
      const fee = calculatePlatformFee({
        category: request.category,
        avityMode: request.avityMode,
        finalValue: request.finalValue,
        urgent: request.urgent,
        partnerType: partner.partnerType,
      });

      appointment = await Appointment.create({
        requestId: request._id,
        patientId: request.patientId,
        partnerId: request.partnerId,
        offerId: request.offerId,
        category: request.category,
        appointmentType: offer.offerType,
        avityMode: request.avityMode,
        scheduledDate: preferredDate,
        scheduledTime: preferredTime,
        finalValue: request.finalValue,
        platformFee: fee.platformFee,
        partnerNetValue: fee.partnerNetValue,
        paymentStatus: "pending",
        appointmentStatus: "scheduled",
        notes,
      });

      request.status = "scheduled";
      await request.save();
    }

    await AuditLog.create({
      actorUserId: req.user?.id || finalPatientId,
      actorRole: req.user?.role || "patient",
      actorName: req.user?.name || "Paciente",
      action: "create_request",
      module: "requests",
      targetType: "request",
      targetId: request._id,
      description: "Solicitação criada.",
      severity: "info",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const io = getSocket();

    if (io) {
      io.to(`partner:${partner._id}`).emit("request:new", {
        request,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Solicitação criada com sucesso.",
      data: {
        request,
        appointment,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao criar solicitação.",
      error: error.message,
    });
  }
}

async function listRequests(req, res) {
  try {
    const { patientId, partnerId, status, category, avityMode } = req.query;

    const filter = {};

    if (isAdmin(req.user)) {
      if (patientId) filter.patientId = patientId;
      if (partnerId) filter.partnerId = partnerId;
    }

    if (req.user.role === "patient") {
      filter.patientId = req.user.id;
    }

    if (["partner_owner", "partner_staff", "partner"].includes(req.user.role)) {
      filter.partnerId = req.user.partnerId;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (avityMode) filter.avityMode = avityMode;

    const requests = await Request.find(filter)
      .populate("patientId", "name email phone")
      .populate("partnerId", "companyName tradeName")
      .populate("offerId", "title basePrice specialty")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar solicitações.",
      error: error.message,
    });
  }
}

async function getRequestById(req, res) {
  try {
    const request = await Request.findById(req.params.id)
      .populate("patientId")
      .populate("partnerId")
      .populate("offerId");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Solicitação não encontrada.",
      });
    }

    if (!hasRequestAccess(req.user, request)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    return res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar solicitação.",
      error: error.message,
    });
  }
}

async function acceptRequest(req, res) {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Solicitação não encontrada.",
      });
    }

    if (!canPartnerRespond(req.user, request)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    const offer = await Offer.findById(request.offerId);
    const partner = await Partner.findById(request.partnerId);

    const fee = calculatePlatformFee({
      category: request.category,
      avityMode: request.avityMode,
      finalValue: request.finalValue,
      urgent: request.urgent,
      partnerType: partner.partnerType,
    });

    const appointment = await Appointment.create({
      requestId: request._id,
      patientId: request.patientId,
      partnerId: request.partnerId,
      offerId: request.offerId,
      category: request.category,
      appointmentType: offer.offerType,
      avityMode: request.avityMode,
      scheduledDate: request.preferredDate,
      scheduledTime: request.preferredTime,
      finalValue: request.finalValue,
      platformFee: fee.platformFee,
      partnerNetValue: fee.partnerNetValue,
      paymentStatus: "pending",
      appointmentStatus: "scheduled",
    });

    request.status = "scheduled";
    request.respondedAt = new Date();
    await request.save();

    const io = getSocket();

    if (io) {
      io.to(`user:${request.patientId}`).emit("request:accepted", {
        request,
        appointment,
      });
    }

    return res.json({
      success: true,
      message: "Solicitação aceita.",
      data: { request, appointment },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao aceitar solicitação.",
      error: error.message,
    });
  }
}

async function counterOfferRequest(req, res) {
  try {
    const { counterOfferValue } = req.body;

    const request = await Request.findById(req.params.id);

    request.status = "counter_offer_sent";
    request.counterOfferValue = counterOfferValue;
    request.respondedAt = new Date();

    await request.save();

    const io = getSocket();

    if (io) {
      io.to(`user:${request.patientId}`).emit("request:counter_offer", {
        request,
      });
    }

    return res.json({
      success: true,
      message: "Contraproposta enviada.",
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro.",
      error: error.message,
    });
  }
}

async function rejectRequest(req, res) {
  try {
    const request = await Request.findById(req.params.id);

    request.status = "rejected";
    request.respondedAt = new Date();

    await request.save();

    const io = getSocket();

    if (io) {
      io.to(`user:${request.patientId}`).emit("request:rejected", {
        request,
      });
    }

    return res.json({
      success: true,
      message: "Solicitação recusada.",
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro.",
      error: error.message,
    });
  }
}

module.exports = {
  createRequest,
  listRequests,
  getRequestById,
  acceptRequest,
  counterOfferRequest,
  rejectRequest,
};