import { redirect } from 'next/navigation';
import Notifications from './index.tsx';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Legacy Notifications entry screen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates routing to Operational Center instead of phantom notification tables', () => {
    const Cmp = Notifications;
    expect(() => Cmp({})).not.toThrow();
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/operational-center');
  });
});
