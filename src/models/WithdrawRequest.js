const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema(
  {
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

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    amount: {
      type: Number,
      required: true,
    },

    fee: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      required: true,
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

    status: {
      type: String,
      enum: [
        "pending_review",
        "approved",
        "processing",
        "paid",
        "rejected",
        "cancelled",
        "blocked",
      ],
      default: "pending_review",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    adminNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);