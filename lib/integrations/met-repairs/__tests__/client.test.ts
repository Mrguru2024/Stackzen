import { MetRepairsApiError, getMetRepairJobs } from '@/lib/integrations/met-repairs/client';

describe('getMetRepairJobs', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.MET_REPAIRS_API_URL = 'https://met-repairs.example.com';
    process.env.MET_REPAIRS_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.MET_REPAIRS_API_URL;
    delete process.env.MET_REPAIRS_API_KEY;
  });

  it('throws when not configured', async () => {
    delete process.env.MET_REPAIRS_API_URL;
    await expect(getMetRepairJobs()).rejects.toBeInstanceOf(MetRepairsApiError);
  });

  it('validates response shape', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: [
            {
              jobId: 'j1',
              clientName: 'Client',
              status: 'COMPLETED',
              revenue: 100,
              laborCost: 10,
              materialCost: 10,
            },
          ],
        }),
    }) as typeof fetch;

    const jobs = await getMetRepairJobs();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/integrations/stackzen/jobs'),
      expect.any(Object)
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0].revenue).toBe(100);
  });

  it('surfaces HTTP errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ error: 'unavailable' }),
    }) as typeof fetch;

    await expect(getMetRepairJobs()).rejects.toMatchObject({
      status: 503,
    });
  });
});
