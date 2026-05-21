const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
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

    requestType: {
      type: String,
      enum: [
        "consultation",
        "negotiation",
        "urgent_care",
        "specialist",
        "medical_membership",
        "exam_order",
        "home_collection",
        "gym_checkin",
        "fitness_credit",
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

    specialty: {
      type: String,
      default: null,
    },

    exams: {
      type: [String],
      default: [],
    },

    gymPlan: {
      type: String,
      default: null,
    },

    offerValue: {
      type: Number,
      default: 0,
    },

    finalValue: {
      type: Number,
      default: 0,
    },

    counterOfferValue: {
      type: Number,
      default: 0,
    },

    urgent: {
      type: Boolean,
      default: false,
    },

    homeCollection: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "waiting_partner_response",
        "auto_accepted",
        "accepted",
        "counter_offer_sent",
        "counter_offer_accepted",
        "rejected",
        "cancelled",
        "expired",
        "scheduled",
        "completed",
      ],
      default: "pending",
    },

    patientLocation: {
      lat: Number,
      lng: Number,
      neighborhood: String,
      city: String,
      state: String,
    },

    preferredDate: {
      type: Date,
      default: null,
    },

    preferredTime: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Request", requestSchema);