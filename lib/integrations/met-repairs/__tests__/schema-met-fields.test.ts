import { mapJobDto, metRepairJobSchema, unwrapList } from '@/lib/integrations/met-repairs/schema';

describe('MET Repairs OS field mapping', () => {
  it('maps MetJobFinancialRecord shape', () => {
    const parsed = metRepairJobSchema.parse({
      jobId: 'job-1',
      workOrderId: 'WO-1',
      customerName: 'Acme',
      status: 'COMPLETED',
      revenue: 1000,
      laborCost: 100,
      materialCost: 200,
      contractorPayout: 300,
      stripeFees: 10,
      leadCost: 5,
      otherExpenses: 5,
      leadSource: 'NSP',
    });
    const job = mapJobDto(parsed);
    expect(job.id).toBe('job-1');
    expect(job.clientName).toBe('Acme');
    expect(job.expenses).toBe(620);
    expect(job.workOrderLabel).toBe('WO-1');
  });

  it('unwraps bare arrays', () => {
    const list = unwrapList([
      metRepairJobSchema.parse({
        jobId: 'j1',
        clientName: 'Client',
        status: 'NEW',
        revenue: 1,
      }),
    ]);
    expect(list).toHaveLength(1);
  });
});
