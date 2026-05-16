import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { createClient } from '@/lib/supabase/client';
import { DeviceInfo } from '@/types/auth';

export class DeviceFingerprint {
  private static instance: DeviceFingerprint;
  private deviceId: string | null = null;
  private securityInfo: {
    isRooted: boolean;
    isJailbroken: boolean;
    isEmulator: boolean;
    isDebuggerAttached: boolean;
    isTampered: boolean;
  };

  private constructor() {
    this.securityInfo = {
      isRooted: false,
      isJailbroken: false,
      isEmulator: false,
      isDebuggerAttached: false,
      isTampered: false,
    };
  }

  static getInstance(): DeviceFingerprint {
    if (!DeviceFingerprint.instance) {
      DeviceFingerprint.instance = new DeviceFingerprint();
    }
    return DeviceFingerprint.instance;
  }

  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      this.deviceId = result.visitorId;
      return this.deviceId;
    } catch (error) {
      console.error('Error getting device fingerprint:', error);
      throw new Error('Failed to get device fingerprint');
    }
  }

  async addDeviceIdToHeaders(headers: Headers): Promise<Headers> {
    const deviceId = await this.getDeviceId();
    headers.set('x-device-id', deviceId);
    return headers;
  }

  private static async getFingerprint(): Promise<string> {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  }

  private static getScreenResolution(): string {
    return `${window.screen.width}x${window.screen.height}`;
  }

  private static getBrowserInfo(): string[] {
    const plugins = Array.from(navigator.plugins).map(p => p.name);
    return plugins;
  }

  private static getCanvasFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw text
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('StackZen', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Security', 4, 45);

    return canvas.toDataURL();
  }

  private static getWebGLFingerprint(): string {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return '';

    return gl.getParameter(gl.VENDOR) + gl.getParameter(gl.RENDERER);
  }

  private static getAudioFingerprint(): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    return analyser.fftSize.toString();
  }

  private async getLocation(): Promise<{
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  }> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      };
    } catch (error) {
      console.warn('Error getting location:', error);
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        latitude: 0,
        longitude: 0,
      };
    }
  }

  private getSecurityInfo() {
    return this.securityInfo;
  }

  public async generateDeviceInfo(): Promise<DeviceInfo> {
    try {
      const location = await this.getLocation();
      const securityInfo = this.getSecurityInfo();

      return {
        fingerprint: await this.getDeviceId(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        colorDepth: window.screen.colorDepth,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as any).deviceMemory,
        platform: navigator.platform,
        plugins: DeviceFingerprint.getBrowserInfo(),
        canvas: DeviceFingerprint.getCanvasFingerprint(),
        webgl: DeviceFingerprint.getWebGLFingerprint(),
        audio: DeviceFingerprint.getAudioFingerprint(),
        fonts: await DeviceFingerprint.getFonts(),
        location,
        mobileInfo: {
          isMobile:
            /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
              navigator.userAgent
            ),
          deviceType: this.getDeviceType(),
          os: this.getOS(),
          browser: this.getBrowser(),
        },
        securityInfo,
      };
    } catch (error) {
      console.warn('Error generating device fingerprint:', error);
      return {
        fingerprint: 'unknown',
        userAgent: 'unknown',
        screenResolution: 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        colorDepth: window.screen.colorDepth,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: (navigator as any).deviceMemory,
        platform: navigator.platform,
        plugins: [],
        canvas: '',
        webgl: '',
        audio: '',
        fonts: [],
        location: {
          country: 'Unknown',
          region: 'Unknown',
          city: 'Unknown',
          latitude: 0,
          longitude: 0,
        },
        mobileInfo: {
          isMobile: false,
          deviceType: 'unknown',
          os: 'unknown',
          browser: 'unknown',
        },
        securityInfo: this.securityInfo,
      };
    }
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') !== -1) return 'Windows';
    if (ua.indexOf('Mac') !== -1) return 'MacOS';
    if (ua.indexOf('Linux') !== -1) return 'Linux';
    if (ua.indexOf('Android') !== -1) return 'Android';
    if (ua.indexOf('like Mac') !== -1) return 'iOS';
    return 'Unknown';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Firefox') !== -1) return 'Firefox';
    if (ua.indexOf('Chrome') !== -1) return 'Chrome';
    if (ua.indexOf('Safari') !== -1) return 'Safari';
    if (ua.indexOf('Edge') !== -1) return 'Edge';
    if (ua.indexOf('MSIE') !== -1 || ua.indexOf('Trident/') !== -1) return 'Internet Explorer';
    return 'Unknown';
  }

  private static async getFonts(): Promise<string[]> {
    if (!document.fonts || !document.fonts.check) {
      return [];
    }

    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const fontList = [
      'Arial',
      'Arial Black',
      'Arial Narrow',
      'Arial Rounded MT Bold',
      'Bookman Old Style',
      'Bradley Hand ITC',
      'Century',
      'Century Gothic',
      'Comic Sans MS',
      'Courier',
      'Courier New',
      'Georgia',
      'Gentium',
      'Impact',
      'King',
      'Lucida Console',
      'Lalit',
      'Modena',
      'Monotype Corsiva',
      'Papyrus',
      'Tahoma',
      'TeX',
      'Times',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
      'Verona',
    ];

    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.getElementsByTagName('body')[0];

    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    const defaultWidth: { [key: string]: number } = {};
    const defaultHeight: { [key: string]: number } = {};

    for (const baseFont of baseFonts) {
      s.style.fontFamily = baseFont;
      h.appendChild(s);
      defaultWidth[baseFont] = s.offsetWidth;
      defaultHeight[baseFont] = s.offsetHeight;
      h.removeChild(s);
    }

    const detected: string[] = [];
    for (const font of fontList) {
      let match = false;
      for (const baseFont of baseFonts) {
        s.style.fontFamily = `${font},${baseFont}`;
        h.appendChild(s);
        const matched =
          s.offsetWidth !== defaultWidth[baseFont] || s.offsetHeight !== defaultHeight[baseFont];
        h.removeChild(s);
        if (matched) {
          match = true;
          break;
        }
      }
      if (match) {
        detected.push(font);
      }
    }

    return detected;
  }

  static async storeDeviceInfo(userId: string, deviceInfo: DeviceInfo): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('user_devices').upsert({
      user_id: userId,
      device_fingerprint: deviceInfo.fingerprint,
      device_info: deviceInfo,
      last_seen: new Date().toISOString(),
    });

    if (error) {
      console.error('Error storing device info:', error);
      throw new Error('Failed to store device information');
    }
  }

  static async getKnownDevices(userId: string): Promise<DeviceInfo[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_devices')
      .select('device_info')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching known devices:', error);
      throw new Error('Failed to fetch known devices');
    }

    return data.map(d => d.device_info as DeviceInfo);
  }

  static async isKnownDevice(userId: string, deviceInfo: DeviceInfo): Promise<boolean> {
    const knownDevices = await this.getKnownDevices(userId);
    return knownDevices.some(device => device.fingerprint === deviceInfo.fingerprint);
  }

  static async isLocationAllowed(userId: string, deviceInfo: DeviceInfo): Promise<boolean> {
    const supabase = createClient();

    // Get user's security settings
    const { data: userSettings, error } = await supabase
      .from('user_security')
      .select('allowed_countries, allowed_regions, security_preferences')
      .eq('user_id', userId)
      .single();

    if (error || !userSettings) {
      return true; // If no restrictions are set, allow all locations
    }

    const { allowed_countries, allowed_regions, security_preferences } = userSettings;

    if (!deviceInfo.location) {
      return true; // If location can't be determined, allow access
    }

    // Check location restrictions
    const isCountryAllowed =
      !allowed_countries?.length || allowed_countries.includes(deviceInfo.location.country);
    const isRegionAllowed =
      !allowed_regions?.length || allowed_regions.includes(deviceInfo.location.region);

    // Check security preferences
    const {
      allowVpn = false,
      allowProxy = false,
      allowTor = false,
      allowHosting = false,
      allowDatacenter = false,
      maxThreatLevel = 'high',
    } = security_preferences || {};

    const isVpnAllowed = allowVpn || !deviceInfo.location.isVpn;
    const isProxyAllowed = allowProxy || !deviceInfo.location.isProxy;
    const isTorAllowed = allowTor || !deviceInfo.location.isTor;
    const isHostingAllowed = allowHosting || !deviceInfo.location.isHosting;
    const isDatacenterAllowed = allowDatacenter || !deviceInfo.location.isDatacenter;

    // Check threat level
    const threatLevels = { low: 0, medium: 1, high: 2 } as const;
    const currentLevel = deviceInfo.location.threatLevel ?? 'low';
    const maxLevel = (maxThreatLevel ?? 'high') as keyof typeof threatLevels;
    const isThreatLevelAllowed = threatLevels[currentLevel] <= threatLevels[maxLevel];

    return (
      isCountryAllowed &&
      isRegionAllowed &&
      isVpnAllowed &&
      isProxyAllowed &&
      isTorAllowed &&
      isHostingAllowed &&
      isDatacenterAllowed &&
      isThreatLevelAllowed
    );
  }
}
