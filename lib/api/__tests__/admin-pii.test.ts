import { maskEmail, parseIncludeSensitive } from '@/lib/api/admin-pii';

describe('admin-pii', () => {
  it('masks email local part', () => {
    expect(maskEmail('admin@stackzen.com')).toBe('a***@stackzen.com');
  });

  it('parses includeSensitive query flag', () => {
    expect(parseIncludeSensitive(new URLSearchParams('includeSensitive=true'))).toBe(true);
    expect(parseIncludeSensitive(new URLSearchParams('includeSensitive=1'))).toBe(true);
    expect(parseIncludeSensitive(new URLSearchParams())).toBe(false);
  });
});
