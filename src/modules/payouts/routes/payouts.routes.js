const express = require("express");

const {
  createPayoutBatch,
  listPayoutBatches,
  getPayoutBatchById,
  approvePayoutBatch,
  markPayoutBatchAsPaid,
} = require("../controllers/payouts.controller");

const {
  authMiddleware,
  requireRole,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/batches",
  authMiddleware,
  requireRole("super_admin", "admin", "finance_admin"),
  createPayoutBatch
);

router.get(
  "/batches",
  authMiddleware,
  requireRole("super_admin", "admin", "finance_admin"),
  listPayoutBatches
);

router.get(
  "/batches/:id",
  authMiddleware,
  requireRole("super_admin", "admin", "finance_admin"),
  getPayoutBatchById
);

router.patch(
  "/batches/:id/approve",
  authMiddleware,
  requireRole("super_admin", "finance_admin"),
  approvePayoutBatch
);

router.patch(
  "/batches/:id/paid",
  authMiddleware,
  requireRole("super_admin", "finance_admin"),
  markPayoutBatchAsPaid
);

module.exports = router;