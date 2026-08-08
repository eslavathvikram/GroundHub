const mongoose = require("mongoose");

const GroundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    groundType: {
      type: String,
      trim: true,
      default: "Other",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=600&auto=format&fit=crop",
    },
    instructions: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    services: {
      type: [String],
      default: [],
    },
    dayPrices: {
      type: Map,
      of: Number,
      default: {},
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slots: {
      type: [String],
      default: [
        "06:00 - 10:00",
        "10:00 - 14:00",
        "14:00 - 18:00"
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ground", GroundSchema);
