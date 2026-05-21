const express = require("express");

const {
  createPartner,
  listPartners,
  getPartnerById,
  updatePartner,
  approvePartner,
  suspendPartner,
  setPartnerOnlineStatus,
} = require("../controllers/partners.controller");

const {
  authMiddleware,
  requireRole,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin"),
  createPartner
);

router.get(
  "/",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin", "support"),
  listPartners
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
    "partner_staff"
  ),
  getPartnerById
);

router.patch(
  "/:id",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "partner_owner"
  ),
  updatePartner
);

router.patch(
  "/:id/approve",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin"),
  approvePartner
);

router.patch(
  "/:id/suspend",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin"),
  suspendPartner
);

router.patch(
  "/:id/online",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "partner_owner",
    "partner_staff"
  ),
  setPartnerOnlineStatus
);

module.exports = router;