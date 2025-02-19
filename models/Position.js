const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Position', PositionSchema);
