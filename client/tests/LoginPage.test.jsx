import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage.jsx';
import { AuthProvider } from '../src/utils/auth.jsx';

const renderPage = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );

afterEach(() => vi.restoreAllMocks());

describe('LoginPage', () => {
  it('shows the server error on failed login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 401,
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid email or password' }),
    });
    renderPage();
    await userEvent.type(screen.getByLabelText('E-pošta'), 'a@b.si');
    await userEvent.type(screen.getByLabelText('Geslo'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Prijava' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('switches to registration and shows the name field', async () => {
    renderPage();
    expect(screen.queryByLabelText('Ime')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText(/Registriraj se/));
    expect(screen.getByLabelText('Ime')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ustvari račun' })).toBeInTheDocument();
  });

  it('stores the token after a successful login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      ok: true,
      json: () =>
        Promise.resolve({ token: 'tok123', user: { id: 1, name: 'Ana', email: 'a@b.si' } }),
    });
    renderPage();
    await userEvent.type(screen.getByLabelText('E-pošta'), 'a@b.si');
    await userEvent.type(screen.getByLabelText('Geslo'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Prijava' }));
    await vi.waitFor(() => expect(localStorage.getItem('studybuddy_token')).toBe('tok123'));
  });
});
