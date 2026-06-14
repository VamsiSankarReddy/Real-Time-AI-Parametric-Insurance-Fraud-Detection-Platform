const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    gps_location: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
      speed: { type: Number, default: 0 },
      route_deviation: { type: Number, default: 0 },
      idle_time: { type: Number, default: 0 }
    },
    sensor_data: {
      accelerometer: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 }
      },
      gyroscope: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 }
      }
    },
    network_data: {
      ip: { type: String, required: true, index: true },
      isp: { type: String, default: 'unknown' },
      vpn: { type: Boolean, default: false }
    },
    trust_score: { type: Number, required: true },
    status: {
      type: String,
      enum: ['approved', 'verification_required', 'fraud_flagged'],
      required: true,
      index: true
    },
    fraud_flags: [{ type: String }],
    fraud_evidence: [{ type: mongoose.Schema.Types.Mixed }],
    ml_scores: {
      movement_score: Number,
      anomaly_score: Number,
      network_score: Number,
      time_pattern_score: Number,
      correlation_score: Number
    },
    timestamp: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Claim', ClaimSchema);
