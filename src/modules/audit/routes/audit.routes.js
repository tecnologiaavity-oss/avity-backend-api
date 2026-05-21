const express = require("express");

const {
  listAuditLogs,
  getAuditLogById,
} = require("../controllers/audit.controller");

const {
  authMiddleware,
  requireRole,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin", "finance_admin"),
  listAuditLogs
);

router.get(
  "/:id",
  authMiddleware,
  requireRole("super_admin", "admin", "operations_admin", "finance_admin"),
  getAuditLogById
);

module.exports = router;