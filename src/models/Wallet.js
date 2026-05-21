const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ["partner", "patient", "platform"],
      required: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
    },

    balance: {
      type: Number,
      default: 0,
    },

    pendingBalance: {
      type: Number,
      default: 0,
    },

    blockedBalance: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "BRL",
    },

    bankAccount: {
      holderName: String,
      documentNumber: String,
      bankName: String,
      agency: String,
      accountNumber: String,
      accountType: String,
      pixKey: String,
      pixKeyType: {
        type: String,
        enum: ["cnpj", "cpf", "email", "phone", "random", null],
        default: null,
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },

    status: {
      type: String,
      enum: ["active", "blocked", "under_review"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Wallet", walletSchema);