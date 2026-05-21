const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    tradeName: {
      type: String,
      default: null,
    },

    partnerType: {
      type: String,
      enum: ["clinic", "laboratory", "gym", "wellness", "aph", "pet"],
      required: true,
    },

    documentType: {
      type: String,
      enum: ["cpf", "cnpj"],
      default: "cnpj",
    },

    documentNumber: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending_review",
        "pending_documents",
        "approved",
        "rejected",
        "suspended",
        "blocked",
      ],
      default: "pending_review",
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    autoAcceptEnabled: {
      type: Boolean,
      default: false,
    },

    autoAcceptMinValue: {
      type: Number,
      default: 0,
    },

    urgencyEnabled: {
      type: Boolean,
      default: false,
    },

    urgencyPrice: {
      type: Number,
      default: 0,
    },

    acceptedGymPlans: {
      type: [String],
      default: [],
    },

    bankDataConfigured: {
      type: Boolean,
      default: false,
    },

    walletBalance: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    totalAppointments: {
      type: Number,
      default: 0,
    },

    totalOrders: {
      type: Number,
      default: 0,
    },

    address: {
      street: String,
      number: String,
      neighborhood: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: "Brasil",
      },
    },

    location: {
      lat: Number,
      lng: Number,

      geo: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: undefined,
        },
      },

      radiusKm: {
        type: Number,
        default: 10,
      },
    },

    specialties: {
      type: [String],
      default: [],
    },

    exams: {
      type: [String],
      default: [],
    },

    gymServices: {
      type: [String],
      default: [],
    },

    availableSchedules: {
      type: [String],
      default: [],
    },

    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

partnerSchema.pre("save", function () {
  if (this.location?.lat && this.location?.lng) {
    this.location.geo = {
      type: "Point",
      coordinates: [this.location.lng, this.location.lat],
    };
  }
});

partnerSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.location?.lat && update?.location?.lng) {
    update.location.geo = {
      type: "Point",
      coordinates: [update.location.lng, update.location.lat],
    };
  }

  this.setUpdate(update);
});

partnerSchema.index({ "location.geo": "2dsphere" });

module.exports = mongoose.model("Partner", partnerSchema);