const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    amount: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      enum: ["pix", "card"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired", "cancelled"],
      default: "pending",
    },

    provider: {
      type: String,
      default: "manual_mock",
    },

    providerPaymentId: {
      type: String,
      default: null,
    },

    pixQrCode: {
      type: String,
      default: null,
    },

    pixCopyPaste: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);