import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { API_BASE_URL } from './constants';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'role' | 'orders'>, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('user_session');
      return null;
    }
  });

  useEffect(() => {
    if (!user) return;
    refreshUser();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_session');
    }
  }, [user]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', identifier, password })
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login failed', e);
      return false;
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'role' | 'orders'>, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', ...userData, password })
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Signup failed', e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: user.id, ...userData })
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (e) {
      console.error('Update user failed', e);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php?id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        data.orders = [];
        setUser(data);
      }
    } catch (e) {
      console.error('Refresh user failed', e);
    }
  };

  // Refresh user on mount to sync with database
  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, []);

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
