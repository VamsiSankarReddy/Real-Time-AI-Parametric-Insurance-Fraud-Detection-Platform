const { submitClaim } = require('./claimService');

const activeSimulations = new Map();

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function generateHonestPayload(index) {
  const now = new Date();
  return {
    user_id: `honest_${index}`,
    gps_location: {
      lat: 12.9716 + randomInRange(-0.01, 0.01),
      lon: 77.5946 + randomInRange(-0.01, 0.01),
      speed: randomInRange(15, 45),
      route_deviation: randomInRange(0, 0.15),
      idle_time: randomInRange(0, 2)
    },
    sensor_data: {
      accelerometer: {
        x: randomInRange(0.8, 2.2),
        y: randomInRange(0.8, 2.2),
        z: randomInRange(8.8, 10.2)
      },
      gyroscope: {
        x: randomInRange(0.2, 1.5),
        y: randomInRange(0.2, 1.5),
        z: randomInRange(0.2, 1.5)
      }
    },
    network_data: {
      ip: `10.0.${index % 20}.${Math.floor(randomInRange(2, 200))}`,
      isp: 'trusted-isp',
      vpn: false
    },
    timestamp: now.toISOString()
  };
}

function generateAttackerPayload(index) {
  const now = new Date();
  return {
    user_id: `attacker_${index}`,
    gps_location: {
      lat: 28.6139 + randomInRange(-0.5, 0.5),
      lon: 77.209 + randomInRange(-0.5, 0.5),
      speed: randomInRange(70, 120),
      route_deviation: randomInRange(0.6, 1.5),
      idle_time: randomInRange(15, 50)
    },
    sensor_data: {
      accelerometer: {
        x: randomInRange(0, 0.2),
        y: randomInRange(0, 0.2),
        z: randomInRange(9.6, 9.9)
      },
      gyroscope: {
        x: randomInRange(0, 0.1),
        y: randomInRange(0, 0.1),
        z: randomInRange(0, 0.1)
      }
    },
    network_data: {
      ip: `185.203.119.${10 + (index % 6)}`,
      isp: 'suspicious-vpn-provider',
      vpn: true
    },
    timestamp: now.toISOString()
  };
}

function startSimulation(simulationId, mode, config) {
  if (activeSimulations.has(simulationId)) {
    return;
  }

  let counter = 0;
  const intervalId = setInterval(async () => {
    counter += 1;
    const payload = mode === 'attacker' ? generateAttackerPayload(counter) : generateHonestPayload(counter);

    try {
      await submitClaim(payload, config);
    } catch (error) {
      console.error(`Simulation ${simulationId} failed:`, error.message);
    }

    if (counter >= 30) {
      stopSimulation(simulationId);
    }
  }, 1500);

  activeSimulations.set(simulationId, intervalId);
}

function stopSimulation(simulationId) {
  const intervalId = activeSimulations.get(simulationId);
  if (!intervalId) {
    return false;
  }

  clearInterval(intervalId);
  activeSimulations.delete(simulationId);
  return true;
}

module.exports = { startSimulation, stopSimulation };
