import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  isActive?: boolean;
  profileImage?: string;
  educationLevel?: string;
  college?: string;
  bio?: string;
  subjects?: string[];
  learningGoals?: string[];
  preferredStudyHours?: number;
  totalStudyMinutes?: number;
  studyPreferences?: {
    dailyGoalMinutes?: number;
    preferredTime?: string;
    difficultyLevel?: string;
  };
  streakDays?: number;
  lastStudyDate?: string;
  createdAt?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (
    emailOrPayload: string | { email: string; password: string },
    password?: string
  ) => Promise<UserProfile>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    educationLevel?: string;
    college?: string;
    subjects?: string[];
    preferredSubjects?: string[];
    learningGoals?: string[];
    preferredStudyHours?: number;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: UserProfile) => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lumina_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('lumina_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setToken(savedToken);
    } catch {
      localStorage.removeItem('lumina_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (
    emailOrPayload: string | { email: string; password: string },
    password?: string
  ): Promise<UserProfile> => {
    const credentials =
      typeof emailOrPayload === 'string'
        ? { email: emailOrPayload, password: password || '' }
        : emailOrPayload;
    const data = await authApi.login(credentials);
    localStorage.setItem('lumina_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    educationLevel?: string;
    college?: string;
    subjects?: string[];
    preferredSubjects?: string[];
    learningGoals?: string[];
    preferredStudyHours?: number;
  }): Promise<UserProfile> => {
    const data = await authApi.register({
      ...payload,
      subjects: payload.subjects || payload.preferredSubjects,
    });
    localStorage.setItem('lumina_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const updateUser = useCallback((updatedUser: UserProfile) => {
    setUser(updatedUser);
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout network error
    }
    localStorage.removeItem('lumina_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
