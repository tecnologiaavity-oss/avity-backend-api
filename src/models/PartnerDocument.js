const mongoose = require("mongoose");

const partnerDocumentSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },

    documentType: {
      type: String,
      enum: [
        "cnpj_card",
        "cpf_document",
        "social_contract",
        "business_license",
        "health_license",
        "professional_license",
        "bank_proof",
        "address_proof",
        "insurance_policy",
        "other",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending_review",
        "approved",
        "rejected",
        "expired",
        "needs_reupload",
      ],
      default: "pending_review",
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PartnerDocument", partnerDocumentSchema);