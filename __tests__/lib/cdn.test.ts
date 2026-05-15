import { CDNService } from '@/lib/cdn';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://cdn.stackzen.com/test.jpg' } }),
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'https://cdn.stackzen.com/test.jpg?token=123' },
          error: null,
        }),
      })),
    },
  })),
}));

describe('CDNService', () => {
  let _cdnService: CDNService;

  beforeEach(() => {
    _cdnService = CDNService.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = CDNService.getInstance();
    const instance2 = CDNService.getInstance();
    expect(_instance1).toBe(_instance2);
  });

  it('should upload asset successfully', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const result = await _cdnService.uploadAsset(_file, 'test.jpg');
    expect(_result).toBe('https://cdn.stackzen.com/test.jpg');
  });

  it('should delete asset successfully', async () => {
    await expect(_cdnService.deleteAsset('test.jpg')).resolves.not.toThrow();
  });

  it('should get public URL', () => {
    const url = _cdnService.getPublicUrl('test.jpg');
    expect(_url).toBe('https://cdn.stackzen.com/test.jpg');
  });

  it('should optimize image with parameters', async () => {
    const result = await _cdnService.optimizeImage('test.jpg', {
      width: 800,
      height: 600,
      quality: 80,
      format: 'webp',
    });
    expect(_result).toContain('width=800');
    expect(_result).toContain('height=600');
    expect(_result).toContain('quality=80');
    expect(_result).toContain('format=webp');
  });
});
