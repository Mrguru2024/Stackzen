import { canAccessMetRepairsCommandCenter } from '@/lib/integrations/met-repairs/access';

describe('canAccessMetRepairsCommandCenter', () => {
  it('allows admin roles', () => {
    expect(canAccessMetRepairsCommandCenter('ADMIN')).toBe(true);
    expect(canAccessMetRepairsCommandCenter('SUPER_ADMIN')).toBe(true);
  });

  it('denies standard users', () => {
    expect(canAccessMetRepairsCommandCenter('USER')).toBe(false);
    expect(canAccessMetRepairsCommandCenter('PRO')).toBe(false);
  });
});
