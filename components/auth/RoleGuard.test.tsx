import React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleGuard } from './RoleGuard';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('RoleGuard', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('renders children when user has required role', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
    });

    render(
      <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when user does not have required role', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: 'USER',
        },
      },
      status: 'authenticated',
    });

    render(
      <RoleGuard allowedRoles={['ADMIN']}>
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading state when session is loading', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'loading',
    });

    render(
      <RoleGuard allowedRoles={['ADMIN']}>
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
