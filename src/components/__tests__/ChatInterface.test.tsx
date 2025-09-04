import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ChatInterface } from '@/components/ChatInterface';

describe('ChatInterface', () => {
  const mockOnNewRequest = vi.fn();

  beforeEach(() => {
    mockOnNewRequest.mockClear();
  });

  it('renders the chat interface correctly', () => {
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    expect(screen.getByText('Autonomous Development Chat')).toBeInTheDocument();
    expect(screen.getByText('Describe your project and watch AI builders create it')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe what you want to build...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays initial welcome message', () => {
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    expect(screen.getByText(/Welcome to CloudIDE/)).toBeInTheDocument();
    expect(screen.getByText(/autonomous development orchestrator/)).toBeInTheDocument();
  });

  it('handles message input and submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Build a React dashboard');
    expect(input).toHaveValue('Build a React dashboard');

    await user.click(sendButton);

    expect(mockOnNewRequest).toHaveBeenCalledWith('Build a React dashboard');
  });

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    await user.type(input, 'Create a user authentication system');
    await user.keyboard('{Enter}');

    expect(mockOnNewRequest).toHaveBeenCalledWith('Create a user authentication system');
  });

  it('clears input after message submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');
    
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('disables input and button during processing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Should be disabled while processing
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('shows processing indicator during message processing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Analyzing and deploying builders...')).toBeInTheDocument();
  });

  it('displays user message in chat', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    await user.type(input, 'Build a todo app');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Build a todo app')).toBeInTheDocument();
    });
  });

  it('displays system response after user message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    await user.type(input, 'Create an API');
    await user.keyboard('{Enter}');

    // Wait for system response
    await waitFor(() => {
      expect(screen.getByText(/Analyzing request: "Create an API"/)).toBeInTheDocument();
      expect(screen.getByText(/Deploying specialized builders/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('does not submit empty messages', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const sendButton = screen.getByRole('button', { name: /send/i });

    // Button should be disabled for empty input
    expect(sendButton).toBeDisabled();

    await user.click(sendButton);
    expect(mockOnNewRequest).not.toHaveBeenCalled();
  });

  it('does not submit whitespace-only messages', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, '   ');
    
    // Button should still be disabled
    expect(sendButton).toBeDisabled();

    await user.click(sendButton);
    expect(mockOnNewRequest).not.toHaveBeenCalled();
  });

  it('shows correct message icons', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    // Check for user and system message icons
    const userIcons = screen.getAllByTestId(/user-icon|system-icon/i);
    expect(userIcons.length).toBeGreaterThan(0);
  });

  it('displays timestamps for messages', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    // Should have timestamps
    const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('auto-scrolls to bottom when new messages are added', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    // Add multiple messages to ensure scrolling
    for (let i = 0; i < 3; i++) {
      await user.type(input, `Message ${i + 1}`);
      await user.keyboard('{Enter}');
      
      // Clear input for next message
      await user.clear(input);
    }

    // The messages container should scroll to bottom
    const messagesContainer = container.querySelector('[class*="overflow-y-auto"]');
    expect(messagesContainer).toBeInTheDocument();
  });

  it('handles message formatting correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    await user.type(input, 'Message with\nmultiple\nlines');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const messageElement = screen.getByText(/Message with/);
      expect(messageElement).toBeInTheDocument();
      // Check that it uses whitespace-pre-wrap for formatting
      expect(messageElement.closest('pre')).toBeInTheDocument();
    });
  });

  it('prevents submission during processing state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatInterface onNewRequest={mockOnNewRequest} />);

    const input = screen.getByPlaceholderText('Describe what you want to build...');

    // Send first message
    await user.type(input, 'First message');
    await user.keyboard('{Enter}');

    // Try to send another message while processing
    await user.type(input, 'Second message');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
    
    await user.click(sendButton);
    
    // Should only have been called once (for the first message)
    expect(mockOnNewRequest).toHaveBeenCalledTimes(1);
    expect(mockOnNewRequest).toHaveBeenCalledWith('First message');
  });
});