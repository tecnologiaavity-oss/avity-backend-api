const express = require("express");

const {
  createDocument,
  listDocuments,
  approveDocument,
  rejectDocument,
  reviewPartnerDocuments,
} = require("../controllers/documents.controller");

const {
  authMiddleware,
  requireRole,
  requirePartnerAccess,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createDocument);

router.get(
  "/",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin", "support"),
  listDocuments
);

router.patch(
  "/:id/approve",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin"),
  approveDocument
);

router.patch(
  "/:id/reject",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin"),
  rejectDocument
);

router.post(
  "/partners/:partnerId/review",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin"),
  reviewPartnerDocuments
);

module.exports = router;