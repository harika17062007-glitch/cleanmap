const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wasteType: {
    type: String,
    required: [true, 'Please select waste type'],
    enum: ['plastic', 'organic', 'electronic', 'hazardous', 'other']
  },
  quantity: {
    type: String,
    required: [true, 'Please specify quantity'],
    enum: ['small', 'medium', 'large']
  },
  location: {
    type: String,
    required: [true, 'Please provide location']
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  imageUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending'
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Report', reportSchema);
