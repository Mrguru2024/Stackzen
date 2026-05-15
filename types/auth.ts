export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  platform: string;
  plugins: string[];
  canvas: string;
  webgl: string;
  audio: string;
  fonts: string[];
  location: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
    isProxy?: boolean;
    isVpn?: boolean;
    isTor?: boolean;
    isp?: string;
  };
  mobileInfo: {
    isMobile: boolean;
    deviceType: string;
    os: string;
    browser: string;
    isNativeApp?: boolean;
    isTablet?: boolean;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
    systemIntegrity?: { isCompromised?: boolean };
    hasScreenLock?: boolean;
    hasBiometrics?: boolean;
    hasRootAccess?: boolean;
    isJailbroken?: boolean;
    isEmulator?: boolean;
    hasDebugger?: boolean;
  };
  securityInfo: {
    isRooted: boolean;
    isJailbroken: boolean;
    isEmulator: boolean;
    isDebuggerAttached: boolean;
    isTampered: boolean;
  };
}
