const Redis = jest.fn(function (...args) {
  if (!(this instanceof Redis)) {
    return new Redis(...args);
  }
  this.get = jest.fn(() => Promise.resolve(null));
  this.set = jest.fn(() => Promise.resolve('OK'));
  // Add more methods as needed
});

module.exports = Redis;
exports.default = Redis;
