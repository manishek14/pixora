'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from './apollo-client';

interface CurrentUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  isPrivate: boolean;
  isVerified: boolean;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      email
      fullName
      avatarUrl
      bio
      website
      isPrivate
      isVerified
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const hasToken = typeof window !== 'undefined' && !!getAccessToken();

  const { data, loading, error, refetch } = useQuery<{ me: CurrentUser }>(ME_QUERY, {
    skip: !hasToken,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    setIsReady(true);
  }, []);

  const [logoutMut] = useMutation(LOGOUT_MUTATION);

  const login = useCallback((access: string, refresh: string) => {
    setTokens(access, refresh);
    refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    try {
      await logoutMut();
    } catch {
      // ignore network errors on logout
    }
    clearTokens();
    refetch({}) as any;
    // Hard redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [logoutMut, refetch]);

  return (
    <AuthContext.Provider
      value={{
        user: data?.me ?? null,
        loading: isReady ? loading : true,
        isAuthenticated: !!data?.me,
        login,
        logout,
        refreshUser: () => refetch(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
