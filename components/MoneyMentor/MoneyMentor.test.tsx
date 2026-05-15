import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MoneyMentor from './index';
import { _useMoneyMentor } from '@/hooks/useMoneyMentor';

// Mock the useMoneyMentor hook
jest.mock('@/hooks/useMoneyMentor', () => ({
  useMoneyMentor: jest.fn(),
}));

const _mockUseMoneyMentor = _useMoneyMentor as jest.Mock;

describe('MoneyMentor', () => {
  const _queryClient = new QueryClient();

  beforeEach(() => {
    _mockUseMoneyMentor.mockReturnValue({
      messages: [
        {
          id: '1',
          content: 'Hello',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      loading: false,
      error: null,
      sendMessage: jest.fn().mockResolvedValue(true),
    });
  });

  it('renders the chat interface with messages', () => {
    render(
      <QueryClientProvider client={_queryClient}>
        <MoneyMentor userId="test-user" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Money Mentor AI')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles sending a new message', async () => {
    const sendMessage = jest.fn().mockResolvedValue(true);
    _mockUseMoneyMentor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage,
    });

    render(
      <QueryClientProvider client={_queryClient}>
        <MoneyMentor userId="test-user" />
      </QueryClientProvider>
    );

    const _input = screen.getByPlaceholderText(/ask about general financial concepts/i);
    const _sendButton = screen.getByTitle('Send message');

    fireEvent.change(_input, { target: { value: 'New message' } });
    fireEvent.click(_sendButton);

    expect(sendMessage).toHaveBeenCalledWith('New message');
  });

  it('displays loading state while waiting for response', () => {
    _mockUseMoneyMentor.mockReturnValue({
      messages: [],
      loading: true,
      error: null,
      sendMessage: jest.fn(),
    });

    render(
      <QueryClientProvider client={_queryClient}>
        <MoneyMentor userId="test-user" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Money Mentor is thinking...')).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    _mockUseMoneyMentor.mockReturnValue({
      messages: [],
      loading: false,
      error: 'Failed to send message',
      sendMessage: jest.fn(),
    });

    render(
      <QueryClientProvider client={_queryClient}>
        <MoneyMentor userId="test-user" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Failed to send message')).toBeInTheDocument();
  });

  it('handles clearing the chat', async () => {
    const sendMessage = jest.fn().mockResolvedValue(true);
    _mockUseMoneyMentor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage,
    });

    render(
      <QueryClientProvider client={_queryClient}>
        <MoneyMentor userId="test-user" />
      </QueryClientProvider>
    );

    const _input = screen.getByPlaceholderText(/ask about general financial concepts/i);
    fireEvent.change(_input, { target: { value: 'New message' } });
    fireEvent.keyDown(_input, { key: 'Enter' });

    expect(sendMessage).toHaveBeenCalledWith('New message');
  });

  it('sends message on Enter key press', async () => {
    const sendMessage = jest.fn().mockResolvedValue(true);
    _mockUseMoneyMentor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage,
    });

    render(
      <QueryClientProvider client={_queryClient}>
        <MoneyMentor userId="test-user" />
      </QueryClientProvider>
    );

    const _input = screen.getByPlaceholderText(/ask about general financial concepts/i);
    fireEvent.change(_input, { target: { value: 'New message' } });
    fireEvent.keyDown(_input, { key: 'Enter' });

    expect(sendMessage).toHaveBeenCalledWith('New message');
  });

  it('renders mentor information', async () => {
    _mockUseMoneyMentor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn().mockResolvedValue({
        name: 'John Doe',
        expertise: 'Financial Planning',
        rating: 4.8,
        sessions: 189,
        students: 67,
      }),
    });

    render(
      <QueryClientProvider client={_queryClient}>
        <MoneyMentor userId="test-user" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Financial Planning')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('189 sessions')).toBeInTheDocument();
      expect(screen.getByText('67 students')).toBeInTheDocument();
    });
  });

  it('handles booking session', async () => {
    _mockUseMoneyMentor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn().mockResolvedValue({
        name: 'John Doe',
        expertise: 'Financial Planning',
        rating: 4.8,
        sessions: 189,
        students: 67,
      }),
    });

    render(
      <QueryClientProvider client={_queryClient}>
        <MoneyMentor userId="test-user" />
      </QueryClientProvider>
    );

    // Fill in booking details
    const _dateInput = screen.getByLabelText('Select Date');
    const _timeSelect = screen.getByLabelText('Select Time');

    fireEvent.change(_dateInput, { target: { value: '2024-03-20' } });
    fireEvent.change(_timeSelect, { target: { value: '10:00 AM' } });

    const _bookButton = screen.getByText('Book Session');
    fireEvent.click(_bookButton);

    await waitFor(() => {
      expect(screen.getByText('Money Mentor is thinking...')).toBeInTheDocument();
    });
  });
});
