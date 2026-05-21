const mongoose = require("mongoose");

const payoutItemSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayoutBatch",
      required: true,
    },

    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending_review", "approved", "processing", "paid", "blocked", "cancelled"],
      default: "pending_review",
    },

    bankSnapshot: {
      holderName: String,
      documentNumber: String,
      bankName: String,
      agency: String,
      accountNumber: String,
      accountType: String,
      pixKey: String,
      pixKeyType: String,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PayoutItem", payoutItemSchema);