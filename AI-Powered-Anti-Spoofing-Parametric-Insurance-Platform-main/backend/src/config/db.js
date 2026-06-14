const mongoose = require('mongoose');

async function connectDb(mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.warn('MongoDB connection failed. Running in in-memory fallback mode:', error.message);
    return false;
  }
}

module.exports = { connectDb };
