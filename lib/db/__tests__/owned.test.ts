import { findOwnedFirst, findOwnedOrThrow, OwnedResourceError, ownedWhere } from '@/lib/db/owned';

describe('owned helpers', () => {
  it('builds composite where', () => {
    expect(ownedWhere('inv_1', 'user_1')).toEqual({ id: 'inv_1', userId: 'user_1' });
  });

  it('findOwnedFirst returns null when not owned', async () => {
    const model = {
      findFirst: jest.fn().mockResolvedValue(null),
    };
    const row = await findOwnedFirst(model, 'a', 'b');
    expect(row).toBeNull();
    expect(model.findFirst).toHaveBeenCalledWith({ where: { id: 'a', userId: 'b' } });
  });

  it('findOwnedOrThrow throws when missing', async () => {
    const model = { findFirst: jest.fn().mockResolvedValue(null) };
    await expect(findOwnedOrThrow(model, 'a', 'b')).rejects.toBeInstanceOf(OwnedResourceError);
  });
});
