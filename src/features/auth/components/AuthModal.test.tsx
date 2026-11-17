import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { ApiError } from '../../../lib/apiClient';
import AuthModal from './AuthModal';

function setup(overrides: Partial<ComponentProps<typeof AuthModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onLogin: vi.fn().mockResolvedValue(undefined),
    onRegister: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const user = userEvent.setup();
  renderWithProviders(<AuthModal {...props} />);
  return { ...props, user };
}

describe('AuthModal visibility', () => {
  it('renders nothing when closed', () => {
    renderWithProviders(
      <AuthModal isOpen={false} onClose={vi.fn()} onLogin={vi.fn()} onRegister={vi.fn()} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the sign-in tab by default', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sign In' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('sign in', () => {
  it('shows validation errors and does not submit an invalid form', async () => {
    const { user, onLogin } = setup();

    await user.click(screen.getByRole('button', { name: 'Sign In Account' }));

    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('submits the credentials and closes on success', async () => {
    const { user, onLogin, onClose } = setup();

    await user.type(screen.getByLabelText('Email Address'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret-pass');
    await user.click(screen.getByRole('button', { name: 'Sign In Account' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onLogin).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secret-pass' });
  });

  it('shows the invalid-credentials message and stays open on a 401', async () => {
    const onLogin = vi.fn().mockRejectedValue(new ApiError(401, 'Unauthorized'));
    const { user, onClose } = setup({ onLogin });

    await user.type(screen.getByLabelText('Email Address'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign In Account' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('register', () => {
  it('switches to the registration form', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('tab', { name: 'Register' }));

    expect(screen.getByRole('tab', { name: 'Register' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText(/Fishing License Number/)).toBeInTheDocument();
  });

  it('rejects a password shorter than eight characters', async () => {
    const { user, onRegister } = setup();

    await user.click(screen.getByRole('tab', { name: 'Register' }));
    await user.type(screen.getByLabelText('First Name'), 'Ana');
    await user.type(screen.getByLabelText('Last Name'), 'Silva');
    await user.type(screen.getByLabelText('Email Address'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(onRegister).not.toHaveBeenCalled();
  });

  it('registers a valid account and closes', async () => {
    const { user, onRegister, onClose } = setup();

    await user.click(screen.getByRole('tab', { name: 'Register' }));
    await user.type(screen.getByLabelText('First Name'), 'Ana');
    await user.type(screen.getByLabelText('Last Name'), 'Silva');
    await user.type(screen.getByLabelText('Email Address'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'long-enough-1');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onRegister).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com' })
    );
  });
});

describe('forgot password', () => {
  it('requests a reset link and confirms without revealing whether the account exists', async () => {
    let requestedEmail: string | undefined;
    server.use(
      http.post('/api/v1/auth/forgot-password', async ({ request }) => {
        const body = (await request.json()) as { email: string };
        requestedEmail = body.email;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email Address'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(
      await screen.findByText('If an account exists for that email, a reset link has been sent.')
    ).toBeInTheDocument();
    expect(requestedEmail).toBe('ana@example.com');
  });

  it('returns to sign in from the reset panel', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    await user.click(screen.getByRole('button', { name: /Back to Sign In/ }));

    expect(screen.getByRole('button', { name: 'Sign In Account' })).toBeInTheDocument();
  });

  it('shows a generic error when the reset request fails', async () => {
    server.use(
      http.post('/api/v1/auth/forgot-password', () =>
        HttpResponse.json({ message: 'Service unavailable' }, { status: 503 })
      )
    );
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    await user.type(screen.getByLabelText('Email Address'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
  });
});

describe('closing', () => {
  it('closes from the close button', async () => {
    const { user, onClose } = setup();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
