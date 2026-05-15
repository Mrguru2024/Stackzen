module.exports = {
  Redis: class RedisMock {
    get() {
      return Promise.resolve(null);
    }
    set() {
      return Promise.resolve('OK');
    }
  },
};
