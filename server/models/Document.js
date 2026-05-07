const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },

  embedding: {
    type: [Number],
    required: true,
  },

  source: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Document", documentSchema);
