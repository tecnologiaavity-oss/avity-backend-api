const Appointment = require("../../../models/Appointment");
const Wallet = require("../../../models/Wallet");
const Transaction = require("../../../models/Transaction");
const AuditLog = require("../../../models/AuditLog");

function hasAppointmentAccess(user, appointment) {
  if (!user) return false;

  if (["super_admin", "admin"].includes(user.role)) {
    return true;
  }

  if (user.role === "patient") {
    return String(appointment.patientId) === String(user.id);
  }

  if (["partner_owner", "partner_staff", "partner"].includes(user.role)) {
    return String(appointment.partnerId) === String(user.partnerId || user.id);
  }

  return false;
}

async function listAppointments(req, res) {
  try {
    const filter = {};

    if (req.user.role === "patient") {
      filter.patientId = req.user.id;
    }

    if (["partner_owner", "partner_staff", "partner"].includes(req.user.role)) {
      filter.partnerId = req.user.partnerId || req.user.id;
    }

    if (req.query.status) {
      filter.appointmentStatus = req.query.status;
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email phone")
      .populate("partnerId", "companyName tradeName partnerType")
      .populate("offerId", "title specialty offerType")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar agendamentos.",
      error: error.message,
    });
  }
}

async function getAppointmentById(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name email phone")
      .populate("partnerId", "companyName tradeName partnerType")
      .populate("offerId", "title specialty offerType");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Agendamento não encontrado.",
      });
    }

    if (!hasAppointmentAccess(req.user, appointment)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    return res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar agendamento.",
      error: error.message,
    });
  }
}

async function confirmAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Agendamento não encontrado.",
      });
    }

    if (!hasAppointmentAccess(req.user, appointment)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    appointment.appointmentStatus = "confirmed";

    await appointment.save();

    return res.json({
      success: true,
      message: "Agendamento confirmado.",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao confirmar agendamento.",
      error: error.message,
    });
  }
}

async function patientCheckin(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Agendamento não encontrado.",
      });
    }

    if (String(appointment.patientId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Somente o paciente pode fazer check-in.",
      });
    }

    appointment.patientCheckinAt = new Date();

    if (appointment.partnerCheckinAt) {
      appointment.checkinStatus = "double_confirmed";
      appointment.appointmentStatus = "scheduled";
    } else {
      appointment.checkinStatus = "patient_checked_in";
      appointment.appointmentStatus = "scheduled";
    }

    await appointment.save();

    return res.json({
      success: true,
      message: "Check-in do paciente realizado.",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro no check-in do paciente.",
      error: error.message,
    });
  }
}

async function partnerCheckin(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Agendamento não encontrado.",
      });
    }

    if (!hasAppointmentAccess(req.user, appointment)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    appointment.partnerCheckinAt = new Date();

    if (appointment.patientCheckinAt) {
      appointment.checkinStatus = "double_confirmed";
      appointment.appointmentStatus = "scheduled";
    } else {
      appointment.checkinStatus = "partner_checked_in";
      appointment.appointmentStatus = "scheduled";
    }

    await appointment.save();

    return res.json({
      success: true,
      message: "Check-in parceiro realizado.",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro no check-in parceiro.",
      error: error.message,
    });
  }
}

async function startAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Agendamento não encontrado.",
      });
    }

    if (!hasAppointmentAccess(req.user, appointment)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    if (appointment.checkinStatus !== "double_confirmed") {
      return res.status(400).json({
        success: false,
        message: "Check-in duplo obrigatório.",
      });
    }

    appointment.appointmentStatus = "in_progress";
    appointment.inProgressAt = new Date();

    await appointment.save();

    return res.json({
      success: true,
      message: "Atendimento iniciado.",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao iniciar atendimento.",
      error: error.message,
    });
  }
}

async function completeAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Agendamento não encontrado.",
      });
    }

    if (!hasAppointmentAccess(req.user, appointment)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    if (appointment.appointmentStatus !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Atendimento precisa estar em andamento.",
      });
    }

    const wallet = await Wallet.findOne({
      partnerId: appointment.partnerId,
      ownerType: "partner",
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Carteira do parceiro não encontrada.",
      });
    }

    appointment.appointmentStatus = "completed";
    appointment.paymentStatus = "paid";
    appointment.completionAt = new Date();

    await appointment.save();

    wallet.balance += appointment.partnerNetValue;
    await wallet.save();

    await Transaction.create({
      walletId: wallet._id,
      ownerType: "partner",
      ownerId: appointment.partnerId,
      type: "partner_revenue",
      amount: appointment.partnerNetValue,
      status: "completed",
      relatedAppointmentId: appointment._id,
      relatedRequestId: appointment.requestId,
      description: "Repasse por atendimento concluído.",
      processedAt: new Date(),
    });

    await AuditLog.create({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      action: "appointment_completed",
      module: "appointments",
      targetId: appointment._id,
      description: "Agendamento concluído.",
      severity: "critical",
    });

    return res.json({
      success: true,
      message: "Agendamento concluído.",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao concluir atendimento.",
      error: error.message,
    });
  }
}

async function cancelAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Agendamento não encontrado.",
      });
    }

    if (!hasAppointmentAccess(req.user, appointment)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    appointment.appointmentStatus = "cancelled";
    appointment.cancellationReason = req.body.reason || "Cancelado manualmente";

    await appointment.save();

    return res.json({
      success: true,
      message: "Agendamento cancelado.",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao cancelar.",
      error: error.message,
    });
  }
}

module.exports = {
  listAppointments,
  getAppointmentById,
  confirmAppointment,
  patientCheckin,
  partnerCheckin,
  startAppointment,
  completeAppointment,
  cancelAppointment,
};