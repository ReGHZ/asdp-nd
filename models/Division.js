const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Division', DivisionSchema);
