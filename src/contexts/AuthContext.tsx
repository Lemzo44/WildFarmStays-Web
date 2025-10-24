import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeLocalStorage } from '../services/MockDataService';

interface User {
  id: string;
  email: string;
  role: 'camper' | 'farmer';
  name?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, role: 'camper' | 'farmer') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize mock data on app load
    initializeLocalStorage();
    
    // Check for stored user on app load
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Use the same testing users as the original project
    const mockUsers = [
      {
        id: '1',
        email: 'camper@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Camper',
        role: 'camper' as const,
        phone: '+1234567890',
        verified: true,
        subscriptionStatus: 'active',
        subscriptionType: 'monthly',
        subscriptionStartDate: '2024-01-15',
        subscriptionEndDate: '2026-01-15',
        subscriptionRenewalDate: '2026-01-15',
        joinDate: '2024-01-15',
      },
      {
        id: '2',
        email: 'farmer@test.com',
        password: 'password123',
        firstName: 'Sarah',
        lastName: 'Farmer',
        role: 'farmer' as const,
        phone: '+1234567891',
        verified: true,
        subscriptionStatus: 'active',
        joinDate: '2024-01-10',
      },
      {
        id: '3',
        email: 'expired@test.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Expired',
        role: 'camper' as const,
        phone: '+1234567892',
        verified: true,
        subscriptionStatus: 'expired',
        subscriptionType: 'monthly',
        subscriptionStartDate: '2023-12-01',
        subscriptionEndDate: '2024-01-01',
        subscriptionRenewalDate: '2024-01-01',
        joinDate: '2023-12-01',
      },
    ];

    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const register = async (email: string, password: string, role: 'camper' | 'farmer'): Promise<boolean> => {
    // Simulate registration
    const newUser: User = {
      id: Date.now().toString(),
      email,
      role,
      name: email.split('@')[0],
    };
    
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
