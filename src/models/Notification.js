const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
    },

    audience: {
      type: String,
      enum: ["patient", "partner", "admin", "system"],
      required: true,
    },

    type: {
      type: String,
      enum: [
        "request_created",
        "request_auto_accepted",
        "appointment_created",
        "patient_checkin",
        "partner_checkin",
        "appointment_started",
        "appointment_completed",
        "wallet_credit",
        "payout_created",
        "payout_paid",
        "system_alert",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);