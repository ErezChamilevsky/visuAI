const mongoose = require('mongoose');

const algorithmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  componentCode: { type: String, required: false }, // Made optional
  schemaType: { type: String, default: 'react', enum: ['react', 'dsl'] }, // new field
  dsl: { type: mongoose.Schema.Types.Mixed }, // new field
  audioUrls: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Algorithm', algorithmSchema);
