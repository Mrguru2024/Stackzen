import { TextEncoder, TextDecoder } from 'util';
import { _ReadableStream } from 'stream/web';
import { _MessagePort } from 'worker_threads';
import { fetch, Headers, Request, Response } from 'undici';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as any;
}
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream;
}
if (typeof globalThis.MessagePort === 'undefined') {
  globalThis.MessagePort = MessagePort;
}
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch;
}
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = Headers;
}
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = Request;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = Response;
}
