import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/auth.jsx';
import { errorMessage } from '../utils/api.js';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="card" onSubmit={submit}>
        <h1>📚 StudyBuddy</h1>
        <p className="muted">{mode === 'login' ? 'Prijava' : 'Registracija'}</p>
        {mode === 'register' && (
          <label>
            Ime
            <input value={form.name} onChange={set('name')} required />
          </label>
        )}
        <label>
          E-pošta
          <input type="email" value={form.email} onChange={set('email')} required />
        </label>
        <label>
          Geslo
          <input type="password" value={form.password} onChange={set('password')} required />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {mode === 'login' ? 'Prijava' : 'Ustvari račun'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
        >
          {mode === 'login' ? 'Nimaš računa? Registriraj se' : 'Že imaš račun? Prijava'}
        </button>
      </form>
    </div>
  );
}
