import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessmentQuestion: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, text: 'Do you have an emergency fund?', order: 1 },
        { id: 2, text: 'Do you track your expenses?', order: 2 },
      ]),
    },
    assessmentAnswer: {
      findMany: jest.fn().mockResolvedValue([
        { questionId: 1, answer: 'Yes', score: 5 },
        { questionId: 2, answer: 'No', score: 1 },
      ]),
    },
  },
}));
import PersonalFinancialAssessment from './index.tsx';
describe('PersonalFinancialAssessment', () => {
  it('renders questions, answers, strengths, and risks', async () => {
    render(<PersonalFinancialAssessment />);
    expect(await screen.findByText(/Personal Financial Assessment/i)).toBeInTheDocument();
    expect(screen.getByText('Do you have an emergency fund?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Do you track your expenses?')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Strengths')).toBeInTheDocument();
    expect(screen.getByText('Risks')).toBeInTheDocument();
    expect(screen.getByText('Do you have an emergency fund?')).toBeInTheDocument(); // Strength
    expect(screen.getByText('Do you track your expenses?')).toBeInTheDocument(); // Risk
  });
  it('shows empty state if no questions', async () => {
    jest.mock('@/lib/prisma', () => ({
      prisma: {
        assessmentQuestion: { findMany: jest.fn().mockResolvedValue([]) },
        assessmentAnswer: { findMany: jest.fn().mockResolvedValue([]) },
      },
    }));
    render(<PersonalFinancialAssessment />);
    expect(await screen.findByText(/no assessment questions found/i)).toBeInTheDocument();
  });
});
