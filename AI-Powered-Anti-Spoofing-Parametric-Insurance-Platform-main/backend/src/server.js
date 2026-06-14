require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const { connectDb } = require('./config/db');
const { initSocket } = require('./config/socket');
const { initCache } = require('./config/cache');

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fraud_detection';

async function bootstrap() {
  await connectDb(mongoUri);
  await initCache(process.env.REDIS_URL || 'redis://localhost:6379');

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server, {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  });

  server.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

bootstrap();
