import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from '../lib/api';
import { toast } from '../lib/toast';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  year_of_study: number;
  semester_of_study: number;
  group?: string;
  specialization?: string;
  profile_picture?: string;
  phone_number?: string;
  is_verified: boolean;
  is_admin: boolean;
  is_disabled: boolean;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    name: string;
    password: string;
    year_of_study: number;
    semester_of_study: number;
    group?: string;
    specialization?: string;
    verification_method: 'email' | 'sms';
    phone_number?: string;
  }) => Promise<any>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await userAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginValue: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await authAPI.login({ login: loginValue, password, remember_me: rememberMe });
      const { access_token } = response.data;

      localStorage.setItem('authToken', access_token);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      const profileResponse = await userAPI.getProfile();
      setUser(profileResponse.data);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    name: string;
    password: string;
    year_of_study: number;
    semester_of_study: number;
    group?: string;
    specialization?: string;
    verification_method: 'email' | 'sms';
    phone_number?: string;
  }) => {
    try {
      const response = await authAPI.register(userData);
      toast({
        title: 'Registration Successful!',
        description: userData.verification_method === 'sms'
          ? 'Check your SMS for a verification code.'
          : 'Check your email for a verification link.',
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast({
        title: 'Registration Failed',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberMe');
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
