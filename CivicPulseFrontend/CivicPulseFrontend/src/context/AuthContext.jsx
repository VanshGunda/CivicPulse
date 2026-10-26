import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const value = sessionStorage.getItem('civicpulse.user');
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('civicpulse.accessToken'));
  const [user, setUser] = useState(readStoredUser);
  const [booting, setBooting] = useState(Boolean(sessionStorage.getItem('civicpulse.accessToken')));

  const signOut = useCallback(() => {
    sessionStorage.removeItem('civicpulse.accessToken');
    sessionStorage.removeItem('civicpulse.user');
    setToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((payload) => {
    const nextToken = payload?.accessToken;
    const nextUser = payload?.user;
    if (!nextToken || !nextUser) throw new Error('The API returned an incomplete authentication response.');
    sessionStorage.setItem('civicpulse.accessToken', nextToken);
    sessionStorage.setItem('civicpulse.user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post('/api/auth/login', credentials);
    return applySession(data);
  }, [applySession]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    return applySession(data);
  }, [applySession]);

  const refreshUser = useCallback(async () => {
    if (!sessionStorage.getItem('civicpulse.accessToken')) {
      setBooting(false);
      return null;
    }
    try {
      const { data } = await api.get('/api/auth/me');
      sessionStorage.setItem('civicpulse.user', JSON.stringify(data));
      setUser(data);
      setToken(sessionStorage.getItem('civicpulse.accessToken'));
      return data;
    } catch (error) {
      if (error?.response?.status === 401) signOut();
      return null;
    } finally {
      setBooting(false);
    }
  }, [signOut]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onUnauthorized = () => signOut();
    window.addEventListener('civicpulse:unauthorized', onUnauthorized);
    return () => window.removeEventListener('civicpulse:unauthorized', onUnauthorized);
  }, [signOut]);

  const value = useMemo(() => ({
    user,
    token,
    booting,
    isAuthenticated: Boolean(token && user),
    isStaff: user?.role === 'STAFF' || user?.role === 'ADMIN',
    isAdmin: user?.role === 'ADMIN',
    signIn,
    register,
    signOut,
    refreshUser,
  }), [user, token, booting, signIn, register, signOut, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
