const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },

    category: {
      type: String,
      enum: ["health", "fitness", "labs", "wellness", "aph", "pet"],
      required: true,
    },

    offerType: {
      type: String,
      enum: [
        "consultation",
        "specialist",
        "urgent_care",
        "exam",
        "home_collection",
        "gym_access",
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

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: null,
    },

    specialty: {
      type: String,
      default: null,
    },

    examName: {
      type: String,
      default: null,
    },

    basePrice: {
      type: Number,
      required: true,
      default: 0,
    },

    minNegotiationPrice: {
      type: Number,
      default: 0,
    },

    urgentPrice: {
      type: Number,
      default: 0,
    },

    homeCollectionFee: {
      type: Number,
      default: 0,
    },

    acceptsNegotiation: {
      type: Boolean,
      default: false,
    },

    acceptsAutoAccept: {
      type: Boolean,
      default: false,
    },

    autoAcceptMinValue: {
      type: Number,
      default: 0,
    },

    urgentAvailable: {
      type: Boolean,
      default: false,
    },

    homeCollectionAvailable: {
      type: Boolean,
      default: false,
    },

    acceptedGymPlans: {
      type: [String],
      default: [],
    },

    creditCost: {
      type: Number,
      default: 1,
    },

    resultTimeHours: {
      type: Number,
      default: null,
    },

    availableDays: {
      type: [String],
      default: [],
    },

    availableHours: {
      type: [String],
      default: [],
    },

    locationRadiusKm: {
      type: Number,
      default: 10,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    visibility: {
      type: String,
      enum: ["public", "private", "admin_only"],
      default: "public",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Offer", offerSchema);