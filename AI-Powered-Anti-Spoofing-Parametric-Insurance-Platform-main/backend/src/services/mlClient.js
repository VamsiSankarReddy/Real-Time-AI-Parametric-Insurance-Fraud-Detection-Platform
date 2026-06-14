const axios = require('axios');

function fallbackEvaluation(payload) {
  const speed = payload.gps_location?.speed || 0;
  const routeDeviation = payload.gps_location?.route_deviation || 0;
  const idleTime = payload.gps_location?.idle_time || 0;
  const accel = payload.sensor_data?.accelerometer || { x: 0, y: 0, z: 9.8 };
  const vpn = Boolean(payload.network_data?.vpn);
  const isp = String(payload.network_data?.isp || '').toLowerCase();

  const horizontalAccel = Math.sqrt((accel.x ** 2) + (accel.y ** 2));
  const gpsSensorMismatch = speed > 55 && horizontalAccel < 0.35;

  let trust = 92;
  const flags = [];
  const evidence = [];

  if (gpsSensorMismatch) {
    trust -= 45;
    flags.push('gps_sensor_mismatch');
    evidence.push({
      type: 'gps_sensor_mismatch',
      details: {
        gps_speed_kmh: Number(speed.toFixed(2)),
        horizontal_accel_mps2: Number(horizontalAccel.toFixed(3))
      }
    });
  }
  if (vpn || isp.includes('vpn') || isp.includes('proxy')) {
    trust -= 30;
    flags.push('vpn_or_proxy_detected');
    evidence.push({
      type: 'vpn_or_proxy_detected',
      details: {
        ip: payload.network_data?.ip,
        isp: payload.network_data?.isp,
        vpn_declared: vpn
      }
    });
  }
  if (routeDeviation > 0.7) {
    trust -= 15;
    flags.push('route_deviation_anomaly');
  }
  if (idleTime > 10) {
    trust -= 10;
    flags.push('idle_time_anomaly');
  }

  trust = Math.max(0, Math.min(100, trust));

  let status = 'approved';
  if (trust < 50) {
    status = 'fraud_flagged';
  } else if (trust <= 80) {
    status = 'verification_required';
    flags.push('manual_review_required');
  }

  return {
    trust_score: trust,
    status,
    fraud_flags: Array.from(new Set(flags)),
    fraud_evidence: evidence,
    component_scores: {
      movement_score: gpsSensorMismatch ? 25 : 90,
      anomaly_score: routeDeviation > 0.7 || idleTime > 10 ? 55 : 85,
      network_score: vpn ? 35 : 90,
      time_pattern_score: 80,
      correlation_score: 80
    }
  };
}

async function evaluateClaimWithML(payload, mlServiceUrl) {
  try {
    if (!mlServiceUrl) {
      throw new Error('ML service URL is not configured');
    }

    const response = await axios.post(`${mlServiceUrl}/evaluate-claim`, payload, {
      timeout: 5000
    });

    return response.data;
  } catch (error) {
    console.warn('ML service unavailable, using backend fallback evaluation:', error.message);
    return fallbackEvaluation(payload);
  }
}

module.exports = { evaluateClaimWithML };
