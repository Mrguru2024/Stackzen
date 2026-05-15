const NodeEnvironment = require('jest-environment-jsdom').default;
const { TextEncoder, TextDecoder } = require('util');
const { ReadableStream } = require('stream/web');
const { MessagePort } = require('worker_threads');
const { fetch, Headers, Request, Response } = require('undici');

class CustomEnv extends NodeEnvironment {
  async setup() {
    await super.setup();
    if (typeof this.global.TextEncoder === 'undefined') {
      this.global.TextEncoder = TextEncoder;
    }
    if (typeof this.global.TextDecoder === 'undefined') {
      this.global.TextDecoder = TextDecoder;
    }
    if (typeof this.global.ReadableStream === 'undefined') {
      this.global.ReadableStream = ReadableStream;
    }
    if (typeof this.global.MessagePort === 'undefined') {
      this.global.MessagePort = MessagePort;
    }
    if (typeof this.global.fetch === 'undefined') {
      this.global.fetch = fetch;
    }
    if (typeof this.global.Headers === 'undefined') {
      this.global.Headers = Headers;
    }
    if (typeof this.global.Request === 'undefined') {
      this.global.Request = Request;
    }
    if (typeof this.global.Response === 'undefined') {
      this.global.Response = Response;
    }
  }
}

module.exports = CustomEnv;
