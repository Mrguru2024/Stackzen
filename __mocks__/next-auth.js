const _jest = require('jest-mock');

const _mockNextAuth = jest.fn((...args) => {
  return function handler(req, res) {
    if (res && typeof res.status === 'function') {
      res.status(200).json({ user: { name: 'Test User' } });
    }
    return { user: { name: 'Test User' } };
  };
});

const _getServerSession = jest.fn().mockResolvedValue({
  user: { id: 'user_123', email: 'test@example.com', name: 'Test User' },
});
const _getSession = jest.fn().mockResolvedValue({
  user: { id: 'user_123', email: 'test@example.com', name: 'Test User' },
});
const _signIn = jest.fn().mockResolvedValue({ url: '/api/auth/callback' });
const _signOut = jest.fn().mockResolvedValue({ url: '/' });
const _unstable_getServerSession = jest.fn().mockResolvedValue({
  user: { id: 'user_123', email: 'test@example.com', name: 'Test User' },
});

module.exports = mockNextAuth;
module.exports.default = mockNextAuth;
module.exports.getServerSession = getServerSession;
module.exports.getSession = getSession;
module.exports.signIn = signIn;
module.exports.signOut = signOut;
module.exports.unstable_getServerSession = unstable_getServerSession;
