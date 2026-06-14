const express = require('express');
const multer = require('multer');
const {
  submitClaim,
  getClaimStatus,
  listClaims,
  verifyClaim
} = require('../services/claimService');
const { buildFraudGraph } = require('../services/graphService');
const { loginUser } = require('../services/authService');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { startSimulation, stopSimulation } = require('../services/simulationService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const authResult = loginUser(username, password, {
    jwtSecret: process.env.JWT_SECRET || 'change_this_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '4h'
  });

  if (!authResult) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  return res.json(authResult);
});

router.post('/submit-claim', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.user_id || !payload.gps_location || !payload.sensor_data || !payload.network_data || !payload.timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const claim = await submitClaim(payload, {
      mlServiceUrl: process.env.ML_SERVICE_URL
    });

    return res.status(201).json({
      claim_id: claim._id,
      trust_score: claim.trust_score,
      status: claim.status,
      fraud_flags: claim.fraud_flags,
      fraud_evidence: claim.fraud_evidence || []
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to submit claim' });
  }
});

router.get('/claim-status/:id', async (req, res) => {
  try {
    const status = await getClaimStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    return res.json(status);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch claim status' });
  }
});

router.get('/claims', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 50);
    const claims = await listClaims(limit);
    return res.json(claims);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to list claims' });
  }
});

router.get('/fraud-graph', async (req, res) => {
  try {
    const claims = await listClaims(100);
    const fraudFocused = claims.filter((claim) => claim.status !== 'approved');
    return res.json(buildFraudGraph(fraudFocused));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to build fraud graph' });
  }
});

router.post('/verify-user', authenticate, authorizeRoles(['adjuster', 'admin']), upload.single('selfie'), async (req, res) => {
  try {
    const { claim_id } = req.body;
    if (!claim_id) {
      return res.status(400).json({ error: 'claim_id is required' });
    }

    const verifiedClaim = await verifyClaim(claim_id);
    if (!verifiedClaim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    return res.json({
      message: 'Manual verification completed',
      claim_id: verifiedClaim._id,
      status: verifiedClaim.status,
      trust_score: verifiedClaim.trust_score
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

router.post('/simulate/:mode/start', (req, res) => {
  const { mode } = req.params;
  if (!['honest', 'attacker'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be honest or attacker' });
  }

  startSimulation(`${mode}_sim`, mode, {
    mlServiceUrl: process.env.ML_SERVICE_URL
  });

  return res.json({ message: `${mode} simulation started` });
});

router.post('/simulate/:mode/stop', (req, res) => {
  const { mode } = req.params;
  if (!['honest', 'attacker'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be honest or attacker' });
  }

  const stopped = stopSimulation(`${mode}_sim`);
  return res.json({ message: stopped ? `${mode} simulation stopped` : `${mode} simulation was not running` });
});

module.exports = router;
