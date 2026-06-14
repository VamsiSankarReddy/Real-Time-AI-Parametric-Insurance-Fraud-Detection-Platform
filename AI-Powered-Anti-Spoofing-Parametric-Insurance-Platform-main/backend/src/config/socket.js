let io;

function initSocket(server, options = {}) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: options.origin || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

module.exports = { initSocket, getIO };
