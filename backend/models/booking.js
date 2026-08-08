const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    ground: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ground",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // format YYYY-MM-DD
      required: true,
    },
    slot: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent double booking of same ground, date, and slot
BookingSchema.index({ ground: 1, date: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model("Booking", BookingSchema);
