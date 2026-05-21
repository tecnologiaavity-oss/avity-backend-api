const mongoose = require("mongoose");

const payoutBatchSchema = new mongoose.Schema(
  {
    cycleDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending_review", "approved", "processing", "paid", "cancelled"],
      default: "pending_review",
    },

    totalPartners: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
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

module.exports = mongoose.model("PayoutBatch", payoutBatchSchema);