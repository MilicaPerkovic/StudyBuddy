import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('studybuddy:logout', onLogout);
    return () => window.removeEventListener('studybuddy:logout', onLogout);
  }, []);

  const handleAuth = (res) => {
    tokenStore.set(res.token);
    setUser(res.user);
  };

  const login = useCallback(
    async (email, password) =>
      handleAuth(await api('/auth/login', { method: 'POST', body: { email, password } })),
    [],
  );
  const register = useCallback(
    async (name, email, password) =>
      handleAuth(await api('/auth/register', { method: 'POST', body: { name, email, password } })),
    [],
  );
  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
