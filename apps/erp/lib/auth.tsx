'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createApiClient, type ApiClient } from '@sweets/api-client';
import { ERP_ROLES, type AuthResponse, type AuthUser } from '@sweets/types';

const STORAGE_KEY = 'sweets.erp.session';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface AuthContext {
  user: AuthUser | null;
  ready: boolean;
  api: ApiClient;
  signIn: (auth: AuthResponse) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthContext | null>(null);

function read(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function write(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Customers are rejected at sign-in; the ERP is for staff, admins and vendors only. */
export function isErpUser(user: AuthUser) {
  return ERP_ROLES.includes(user.role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(read());
    setReady(true);
  }, []);

  const api = useMemo(() => {
    // Share one in-flight refresh between concurrent 401s.
    let refreshing: Promise<string | null> | null = null;
    return createApiClient({
      baseUrl: API_URL,
      getAccessToken: () => read()?.accessToken,
      refreshAccessToken: () =>
        (refreshing ??= (async () => {
          const current = read();
          if (!current) return null;
          try {
            const auth = await createApiClient({ baseUrl: API_URL }).auth.refresh(
              current.refreshToken,
            );
            const next = {
              user: auth.user,
              accessToken: auth.accessToken,
              refreshToken: auth.refreshToken,
            };
            write(next);
            setSession(next);
            return auth.accessToken;
          } catch {
            write(null);
            setSession(null);
            return null;
          } finally {
            refreshing = null;
          }
        })()),
    });
  }, []);

  const signIn = useCallback((auth: AuthResponse) => {
    const next = {
      user: auth.user,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    };
    write(next);
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    const current = read();
    write(null);
    setSession(null);
    if (current) await api.auth.logout(current.refreshToken).catch(() => undefined);
  }, [api]);

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, ready, api, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
