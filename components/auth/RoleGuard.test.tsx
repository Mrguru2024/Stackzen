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
  });

  it('renders children when user has required role', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: 'freelancer',
        },
      },
      status: 'authenticated',
    });

    render(
      <RoleGuard allowedRoles={['freelancer']}>
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when user does not have required role', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: 'client',
        },
      },
      status: 'authenticated',
    });

    render(
      <RoleGuard allowedRoles={['freelancer']}>
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('shows loading state when session is loading', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'loading',
    });

    render(
      <RoleGuard allowedRoles={['freelancer']}>
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
