import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (token) {
      // Interceptor in api.js automatically attaches the token header
      api.get('/api/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('bb_token'))
        .finally(() => setLoading(false));
    } else {
      const guest = sessionStorage.getItem('bb_guest');
      if (guest) setUser(JSON.parse(guest));
      setLoading(false);
    }
  }, []);

  const register = async (username, email, password) => {
    const res = await api.post('/api/auth/register', { username, email, password });
    localStorage.setItem('bb_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const login = async (username, password) => {
    const res = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('bb_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const loginAsGuest = async (username) => {
    const res = await api.post('/api/auth/guest', { username });
    sessionStorage.setItem('bb_guest', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('bb_token');
    sessionStorage.removeItem('bb_guest');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
