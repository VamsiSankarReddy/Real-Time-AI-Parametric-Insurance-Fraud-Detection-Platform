const jwt = require('jsonwebtoken');

const demoUsers = [
  { username: 'worker1', password: 'worker123', role: 'worker' },
  { username: 'adjuster1', password: 'adjuster123', role: 'adjuster' },
  { username: 'admin1', password: 'admin123', role: 'admin' }
];

function loginUser(username, password, config) {
  const user = demoUsers.find((u) => u.username === username && u.password === password);
  if (!user) {
    return null;
  }

  const token = jwt.sign(
    {
      sub: user.username,
      role: user.role
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn
    }
  );

  return {
    token,
    role: user.role,
    username: user.username
  };
}

module.exports = { loginUser };
