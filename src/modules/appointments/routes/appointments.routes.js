const express = require("express");

const {
  listAppointments,
  getAppointmentById,
  confirmAppointment,
  patientCheckin,
  partnerCheckin,
  startAppointment,
  completeAppointment,
  cancelAppointment,
} = require("../controllers/appointments.controller");

const {
  authMiddleware,
  requireRole,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "support",
    "partner_owner",
    "partner_staff",
    "patient"
  ),
  listAppointments
);

router.get(
  "/:id",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "support",
    "partner_owner",
    "partner_staff",
    "patient"
  ),
  getAppointmentById
);

router.patch(
  "/:id/confirm",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin", "partner_owner", "partner_staff"),
  confirmAppointment
);

router.patch(
  "/:id/patient-checkin",
  authMiddleware,
  requireRole("super_admin", "admin", "patient"),
  patientCheckin
);

router.patch(
  "/:id/partner-checkin",
  authMiddleware,
  requireRole("super_admin", "admin", "partner_owner", "partner_staff"),
  partnerCheckin
);

router.patch(
  "/:id/start",
  authMiddleware,
  requireRole("super_admin", "admin", "partner_owner", "partner_staff"),
  startAppointment
);

router.patch(
  "/:id/complete",
  authMiddleware,
  requireRole("super_admin", "admin", "partner_owner", "partner_staff"),
  completeAppointment
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin", "partner_owner", "partner_staff", "patient"),
  cancelAppointment
);

module.exports = router;