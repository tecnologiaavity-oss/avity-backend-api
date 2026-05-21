const mongoose = require("mongoose");

function generateCheckinCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const appointmentSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },

    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      default: null,
    },

    category: {
      type: String,
      enum: ["health", "fitness", "labs", "wellness", "aph", "pet"],
      required: true,
    },

    appointmentType: {
      type: String,
      enum: [
        "consultation",
        "specialist",
        "urgent_care",
        "exam",
        "home_collection",
        "gym_checkin",
        "fitness_class",
        "wellness_service",
        "aph_service",
        "pet_service",
      ],
      required: true,
    },

    avityMode: {
      type: String,
      enum: [
        "negocia",
        "essencial",
        "premium",
        "especialista",
        "urgencia",
        "medical_membership",
        "credits",
        "unit_credit",
        "lab_order",
        "aph",
      ],
      required: true,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    scheduledTime: {
      type: String,
      required: true,
    },

    finalValue: {
      type: Number,
      default: 0,
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    partnerNetValue: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "authorized", "paid", "refunded", "failed"],
      default: "pending",
    },

    appointmentStatus: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "patient_checked_in",
        "partner_checked_in",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "scheduled",
    },

    checkinCode: {
      type: String,
      default: generateCheckinCode,
    },

    checkinStatus: {
      type: String,
      enum: [
        "not_started",
        "patient_checked_in",
        "partner_checked_in",
        "double_confirmed",
      ],
      default: "not_started",
    },

    patientCheckinAt: {
      type: Date,
      default: null,
    },

    partnerCheckinAt: {
      type: Date,
      default: null,
    },

    inProgressAt: {
      type: Date,
      default: null,
    },

    completionAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);