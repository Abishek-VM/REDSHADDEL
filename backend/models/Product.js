const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    brand: {
      type: String,
      default: "RedShaddel"
    },

    image: {
      type: String,
      required: true
    },

    sizes: {
      type: [String],
      default: ["S", "M", "L", "XL"]
    },

    colors: {
      type: [String],
      default: ["Black"]
    },

    stock: {
      type: Number,
      default: 0
    },

    featured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);