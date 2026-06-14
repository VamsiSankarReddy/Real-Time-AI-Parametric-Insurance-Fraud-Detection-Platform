const { createClient } = require('redis');

let redisClient;
const memoryCache = new Map();

async function initCache(redisUrl) {
  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => {
      console.warn('Redis client error:', err.message);
    });

    await redisClient.connect();
    console.log('Redis cache connected');
    return true;
  } catch (error) {
    console.warn('Redis unavailable. Using in-memory cache fallback:', error.message);
    redisClient = null;
    return false;
  }
}

async function getCache(key) {
  if (redisClient?.isOpen) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  const memoryEntry = memoryCache.get(key);
  if (!memoryEntry) {
    return null;
  }

  if (memoryEntry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return memoryEntry.value;
}

async function setCache(key, value, ttlSeconds = 120) {
  if (redisClient?.isOpen) {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return;
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

module.exports = {
  initCache,
  getCache,
  setCache
};
