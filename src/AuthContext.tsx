import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'role' | 'orders'>, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('all_users');
    return saved ? JSON.parse(saved) : [
      // Seed an admin user for initial access
      { 
        id: 'admin-1', 
        name: 'Admin', 
        email: 'admin@amardokan.com', 
        phone: '01700000000', 
        role: 'Admin', 
        orders: [] 
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('all_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_session');
    }
  }, [user]);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    // In a real app, you'd check passwords. For this mock, we just check email or phone.
    const foundUser = users.find(u => u.email === identifier || u.phone === identifier);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const signup = async (userData: Omit<User, 'id' | 'role' | 'orders'>, password: string): Promise<boolean> => {
    // If email is provided, check for duplicate email
    if (userData.email) {
      if (users.some(u => u.email === userData.email)) return false;
    }
    
    // Check for duplicate phone
    if (users.some(u => u.phone === userData.phone)) return false;

    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      role: 'User',
      orders: []
    };

    setUsers([...users, newUser]);
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
