const express = require("express");

const {
  createPixPayment,
  getPaymentStatus,
  mockApprovePayment,
} = require("../controllers/payments.controller");

const { authMiddleware } = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.post("/pix", authMiddleware, createPixPayment);

router.get("/:id/status", authMiddleware, getPaymentStatus);

// apenas para teste enquanto não temos gateway real
router.patch("/:id/mock-approve", authMiddleware, mockApprovePayment);

module.exports = router;