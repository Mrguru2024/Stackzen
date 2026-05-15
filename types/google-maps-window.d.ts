/// <reference types="google.maps" />

/**
 * The Maps JS API attaches the same `google` object to `window` when loaded via script tag.
 * `@types/google.maps` types the `google` namespace but does not augment `Window` by default.
 */
export {};

declare global {
  interface Window {
    google?: {
      maps: typeof google.maps;
    };
  }
}
