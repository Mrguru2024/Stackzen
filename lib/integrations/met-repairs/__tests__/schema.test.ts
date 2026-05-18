import { metRepairJobListSchema, unwrapList, mapJobDto } from '@/lib/integrations/met-repairs/schema';

describe('metRepairJobListSchema', () => {
  it('accepts bare array payloads', () => {
    const parsed = metRepairJobListSchema.parse([
      {
        id: 'j1',
        clientName: 'Client',
        status: 'COMPLETED',
        revenue: 100,
        expenses: 40,
      },
    ]);
    const list = unwrapList(parsed).map(mapJobDto);
    expect(list).toHaveLength(1);
    expect(list[0].workOrderLabel).toBe('j1');
  });

  it('accepts wrapped payloads', () => {
    const parsed = metRepairJobListSchema.parse({
      data: [
        {
          id: 'j2',
          workOrderNumber: 'WO-2',
          clientName: 'Client',
          status: 'NEW',
          revenue: 50,
        },
      ],
    });
    expect(unwrapList(parsed)[0].workOrderNumber).toBe('WO-2');
  });
});
