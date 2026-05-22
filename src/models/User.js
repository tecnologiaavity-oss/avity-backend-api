const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    role: {
      type: String,
      enum: [
        "super_admin",
        "admin",
        "finance_admin",
        "operations_admin",
        "support",
        "patient",
        "partner_owner",
        "partner_staff",
      ],
      default: "patient",
    },

    status: {
      type: String,
      enum: ["active", "pending", "suspended", "blocked"],
      default: "active",
    },

    permissions: {
      type: [String],
      default: [],
    },

    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
    },

    priority: {
      active: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ["inactive", "active", "past_due", "cancelled", "expired"],
        default: "inactive",
      },
      plan: {
        type: String,
        default: null,
      },
      planName: {
        type: String,
        default: null,
      },
      memberId: {
        type: String,
        default: null,
        index: true,
      },
      coverage: {
        type: String,
        enum: ["none", "national", "national_international"],
        default: "none",
      },
      virtualCardEnabled: {
        type: Boolean,
        default: false,
      },
      physicalCardRequested: {
        type: Boolean,
        default: false,
      },
      physicalCardStatus: {
        type: String,
        enum: ["none", "requested", "processing", "shipped", "delivered"],
        default: "none",
      },
      startedAt: {
        type: Date,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);