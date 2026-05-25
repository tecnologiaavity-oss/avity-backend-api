const express = require("express");

const {
  createPixPayment,
  createCardPayment,
  createCoparticipationPayment,
  getPaymentStatus,
  mockApprovePayment,
} = require("../controllers/payments.controller");

const { authMiddleware } = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.post("/pix", authMiddleware, createPixPayment);
router.post("/card", authMiddleware, createCardPayment);
router.post("/coparticipation", authMiddleware, createCoparticipationPayment);

router.get("/:id/status", authMiddleware, getPaymentStatus);

router.patch("/:id/mock-approve", authMiddleware, mockApprovePayment);

module.exports = router;