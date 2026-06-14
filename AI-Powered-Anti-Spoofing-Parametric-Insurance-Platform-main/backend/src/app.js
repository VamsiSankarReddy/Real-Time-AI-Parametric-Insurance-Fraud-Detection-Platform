const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const claimRoutes = require('./routes/claimRoutes');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'backend' });
  });

  app.use('/api', claimRoutes);

  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
