import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeLocalStorage } from '../services/MockDataService';
import { supabase, useSupabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  role: 'camper' | 'farmer' | 'admin';
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  farmName?: string;
  farmAddress?: string;
  postcode?: string;
  isAdmin?: boolean;
  adminLevel?: number;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, role: 'camper' | 'farmer' | 'admin', userData?: Partial<User>) => Promise<boolean>;
  isAdmin: () => boolean;
  isCamper: () => boolean;
  isFarmer: () => boolean;
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

  // Load user profile from Supabase
  const loadUserFromSupabase = async (supabaseUser: SupabaseUser) => {
    try {
      if (!supabase) return;

      // Fetch profile from public.profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      // Map Supabase user + profile to app User type
      const user: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: (profile?.role || 'camper') as 'camper' | 'farmer' | 'admin',
        name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || supabaseUser.email?.split('@')[0] || '',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        phone: profile?.phone || undefined,
        farmName: profile?.farm_name || undefined,
        farmAddress: profile?.farm_address || undefined,
        postcode: profile?.postcode || undefined,
        isAdmin: profile?.role === 'admin',
        adminLevel: profile?.role === 'admin' ? 2 : undefined,
      };

      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user from Supabase:', error);
    }
  };

  useEffect(() => {
    // Initialize mock data on app load
    initializeLocalStorage();
    
    // Load Supabase session if enabled
    if (useSupabase && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          loadUserFromSupabase(session.user);
        }
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          loadUserFromSupabase(session.user);
        } else {
          setCurrentUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Fallback: Check for stored user in localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (useSupabase && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Login error:', error);
          return false;
        }

        if (data.user) {
          await loadUserFromSupabase(data.user);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Login exception:', error);
        return false;
      }
    }

    // Fallback to localStorage mock users
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
    {
      id: '4',
      email: 'admin@wildfarmstays.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin' as const,
      phone: '+353123456789',
      verified: true,
      subscriptionStatus: 'active',
      joinDate: '2024-01-01',
      isAdmin: true,
      adminLevel: 2,
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

  const register = async (email: string, password: string, role: 'camper' | 'farmer' | 'admin', userData?: Partial<User>): Promise<boolean> => {
    if (useSupabase && supabase) {
      try {
        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
          },
        });

        if (authError) {
          console.error('Registration auth error:', authError);
          console.error('Auth error details:', JSON.stringify(authError, null, 2));
          return false;
        }

        if (!authData.user) {
          console.error('No user returned from signup');
          return false;
        }

        // 2. Create profile in public.profiles
        const profileData = {
          id: authData.user.id,
          email: authData.user.email || email,
          first_name: userData?.firstName || userData?.name?.split(' ')[0] || '',
          last_name: userData?.lastName || userData?.name?.split(' ').slice(1).join(' ') || '',
          phone: userData?.phone || null,
          role: role,
          farm_name: role === 'farmer' ? (userData?.farmName || null) : null,
          farm_address: role === 'farmer' ? (userData?.farmAddress || null) : null,
          postcode: role === 'farmer' ? (userData?.postcode || null) : null,
          subscription_status: 'active',
        };

        console.log('Creating profile with data:', { ...profileData, id: '[UUID]' });

        const { data: profileInsertResult, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select();

        if (profileError) {
          console.error('Error creating profile:', profileError);
          console.error('Profile error details:', JSON.stringify(profileError, null, 2));
          console.error('Profile data attempted:', profileData);
          // Show user-friendly error
          alert(`Profile creation failed: ${profileError.message || 'Unknown error'}`);
          return false;
        }

        console.log('Profile created successfully:', profileInsertResult);

        // 3. Load the new user
        await loadUserFromSupabase(authData.user);
        return true;
      } catch (error) {
        console.error('Registration exception:', error);
        return false;
      }
    }

    // Fallback to localStorage
    const newUser: User = {
      id: Date.now().toString(),
      email,
      role,
      name: email.split('@')[0],
      isAdmin: role === 'admin',
      adminLevel: role === 'admin' ? 2 : undefined,
      ...userData
    };
    
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    allUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(allUsers));
    
    return true;
  };

  const logout = () => {
    if (useSupabase && supabase) {
      supabase.auth.signOut().then(() => {
        setCurrentUser(null);
      }).catch((error) => {
        console.error('Logout error:', error);
        setCurrentUser(null);
      });
    } else {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    }
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin' || currentUser?.isAdmin === true;
  };

  const isCamper = () => {
    return currentUser?.role === 'camper';
  };

  const isFarmer = () => {
    return currentUser?.role === 'farmer';
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    isAdmin,
    isCamper,
    isFarmer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
