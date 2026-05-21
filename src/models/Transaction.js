const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    ownerType: {
      type: String,
      enum: ["partner", "patient", "platform"],
      required: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "payment",
        "platform_fee",
        "partner_revenue",
        "withdraw_request",
        "withdraw_paid",
        "withdraw_rejected",
        "payout_reserved",
        "refund",
        "chargeback",
        "manual_adjustment",
        "credit_purchase",
        "subscription_payment",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "BRL",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "blocked",
        "under_review",
      ],
      default: "pending",
    },

    relatedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },

    relatedAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    description: {
      type: String,
      default: null,
    },

    metadata: {
      type: Object,
      default: {},
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);