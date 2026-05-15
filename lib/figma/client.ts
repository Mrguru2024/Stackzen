const { Api } = require('figma-api');

const api = new Api({
  personalAccessToken: process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
});

module.exports = api;
