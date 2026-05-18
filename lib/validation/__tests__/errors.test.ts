import { z } from 'zod';
import { zodErrorResponse } from '../errors';

describe('zodErrorResponse', () => {
  it('returns generic message without exposing Zod issue codes', async () => {
    const schema = z.object({ email: z.string().email() }).strict();
    const parsed = schema.safeParse({ email: 'bad' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const res = zodErrorResponse(parsed.error);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBeTruthy();
      expect(JSON.stringify(body)).not.toContain('invalid_string');
    }
  });
});
