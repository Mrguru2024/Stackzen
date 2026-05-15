import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class CDNService {
  private static instance: CDNService;
  private bucket: string;

  private constructor() {
    this.bucket = process.env.NODE_ENV === 'production' ? 'cdn-prod' : 'cdn-dev';
  }

  static getInstance(): CDNService {
    if (!CDNService.instance) {
      CDNService.instance = new CDNService();
    }
    return CDNService.instance;
  }

  async uploadAsset(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(this.bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) throw error;

    return this.getPublicUrl(path);
  }

  async deleteAsset(path: string): Promise<void> {
    const { error } = await supabase.storage.from(this.bucket).remove([path]);

    if (error) throw error;
  }

  getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(this.bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  async optimizeImage(
    path: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif';
    }
  ): Promise<string> {
    const { data, error } = await supabase.storage.from(this.bucket).createSignedUrl(path, 3600);

    if (error) throw error;

    const _url = new URL(data.signedUrl);
    if (options.width) _url.searchParams.set('width', options.width.toString());
    if (options.height) _url.searchParams.set('height', options.height.toString());
    if (options.quality) _url.searchParams.set('quality', options.quality.toString());
    if (options.format) _url.searchParams.set('format', options.format);

    return _url.toString();
  }
}
