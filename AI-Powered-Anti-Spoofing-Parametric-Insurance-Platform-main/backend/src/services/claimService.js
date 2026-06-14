const Claim = require('../models/Claim');
const { evaluateClaimWithML } = require('./mlClient');
const { getIO } = require('../config/socket');
const { createHash, randomUUID } = require('crypto');
const mongoose = require('mongoose');
const { getCache, setCache } = require('../config/cache');

const memoryClaims = new Map();

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

async function submitClaim(payload, config) {
  const featureFingerprint = createHash('sha256')
    .update(JSON.stringify({
      user_id: payload.user_id,
      gps_location: payload.gps_location,
      sensor_data: payload.sensor_data,
      network_data: payload.network_data
    }))
    .digest('hex');

  const cacheKey = `trust:${featureFingerprint}`;
  let mlResult = await getCache(cacheKey);

  if (!mlResult) {
    mlResult = await evaluateClaimWithML(payload, config.mlServiceUrl);
    await setCache(cacheKey, mlResult, 120);
  }

  let claim;
  if (isDbConnected()) {
    claim = await Claim.create({
      user_id: payload.user_id,
      gps_location: payload.gps_location,
      sensor_data: payload.sensor_data,
      network_data: payload.network_data,
      trust_score: mlResult.trust_score,
      status: mlResult.status,
      fraud_flags: mlResult.fraud_flags,
      fraud_evidence: mlResult.fraud_evidence || [],
      ml_scores: mlResult.component_scores,
      timestamp: new Date(payload.timestamp)
    });
  } else {
    const id = randomUUID();
    claim = {
      _id: id,
      user_id: payload.user_id,
      gps_location: payload.gps_location,
      sensor_data: payload.sensor_data,
      network_data: payload.network_data,
      trust_score: mlResult.trust_score,
      status: mlResult.status,
      fraud_flags: mlResult.fraud_flags,
      fraud_evidence: mlResult.fraud_evidence || [],
      ml_scores: mlResult.component_scores,
      timestamp: new Date(payload.timestamp)
    };
    memoryClaims.set(id, claim);
  }

  try {
    const io = getIO();
    io.emit('claim_update', {
      id: claim._id,
      user_id: claim.user_id,
      trust_score: claim.trust_score,
      status: claim.status,
      fraud_flags: claim.fraud_flags,
      fraud_evidence: claim.fraud_evidence || [],
      timestamp: claim.timestamp
    });
  } catch (error) {
    console.warn('Socket event skipped:', error.message);
  }

  return claim;
}

async function getClaimStatus(claimId) {
  const claim = isDbConnected()
    ? await Claim.findById(claimId).lean()
    : memoryClaims.get(claimId);
  if (!claim) {
    return null;
  }

  return {
    id: claim._id,
    trust_score: claim.trust_score,
    status: claim.status,
    fraud_flags: claim.fraud_flags,
    fraud_evidence: claim.fraud_evidence || []
  };
}

async function listClaims(limit = 50) {
  if (isDbConnected()) {
    return Claim.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  return Array.from(memoryClaims.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

async function verifyClaim(claimId) {
  if (isDbConnected()) {
    const claim = await Claim.findById(claimId);
    if (!claim) {
      return null;
    }

    claim.status = 'approved';
    claim.trust_score = Math.max(claim.trust_score, 82);
    claim.fraud_flags = claim.fraud_flags.filter((f) => f !== 'manual_review_required');
    await claim.save();

    try {
      const io = getIO();
      io.emit('claim_update', {
        id: claim._id,
        user_id: claim.user_id,
        trust_score: claim.trust_score,
        status: claim.status,
        fraud_flags: claim.fraud_flags,
        fraud_evidence: claim.fraud_evidence || [],
        timestamp: claim.timestamp
      });
    } catch (error) {
      console.warn('Socket event skipped:', error.message);
    }

    return claim;
  }

  const claim = memoryClaims.get(claimId);
  if (!claim) {
    return null;
  }

  claim.status = 'approved';
  claim.trust_score = Math.max(claim.trust_score, 82);
  claim.fraud_flags = (claim.fraud_flags || []).filter((f) => f !== 'manual_review_required');
  memoryClaims.set(claimId, claim);

  try {
    const io = getIO();
    io.emit('claim_update', {
      id: claim._id,
      user_id: claim.user_id,
      trust_score: claim.trust_score,
      status: claim.status,
      fraud_flags: claim.fraud_flags,
      fraud_evidence: claim.fraud_evidence || [],
      timestamp: claim.timestamp
    });
  } catch (error) {
    console.warn('Socket event skipped:', error.message);
  }

  return claim;
}

module.exports = {
  submitClaim,
  getClaimStatus,
  listClaims,
  verifyClaim
};
