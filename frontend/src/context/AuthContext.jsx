import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('role'); // 'role' | 'musician' — for admin, maestro, section_leader

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      apiClient.get('/auth/me')
        .then((res) => {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Keepalive ping every 5 minutes while logged in
  useEffect(() => {
    if (!user) return;
    const ping = () => apiClient.post('/musician/keepalive').catch(() => {});
    ping();
    const interval = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Called after successful code verification, admin password login, or registration
  const loginWithToken = ({ user: userData, token }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data.data);
      localStorage.setItem('user', JSON.stringify(res.data.data));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout, refreshUser, isAdmin: user?.role === 'admin', isMaestro: user?.role === 'maestro', isSectionLeader: user?.role === 'section_leader', hasRoleSwitch: ['admin', 'maestro', 'section_leader'].includes(user?.role), viewMode: viewMode === 'musician' ? 'musician' : (user?.role === 'admin' ? 'admin' : user?.role || 'musician'), setViewMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
