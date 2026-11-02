'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createApiClient, type ApiClient } from '@sweets/api-client';
import type { AuthResponse, AuthUser } from '@sweets/types';

const STORAGE_KEY = 'sweets.session';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface SessionContext {
  user: AuthUser | null;
  ready: boolean;
  api: ApiClient;
  signIn: (auth: AuthResponse) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionContext | null>(null);

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setReady(true);
  }, []);

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: API_URL,
        getAccessToken: () => readSession()?.accessToken,
        refreshAccessToken: async () => {
          const current = readSession();
          if (!current) return null;
          try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: current.refreshToken }),
            });
            if (!res.ok) throw new Error();
            const auth = (await res.json()) as AuthResponse;
            const next = {
              user: auth.user,
              accessToken: auth.accessToken,
              refreshToken: auth.refreshToken,
            };
            writeSession(next);
            setSession(next);
            return auth.accessToken;
          } catch {
            writeSession(null);
            setSession(null);
            return null;
          }
        },
      }),
    [],
  );

  const signIn = useCallback((auth: AuthResponse) => {
    const next = {
      user: auth.user,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    };
    writeSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    const current = readSession();
    writeSession(null);
    setSession(null);
    if (current) await api.auth.logout(current.refreshToken).catch(() => undefined);
  }, [api]);

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, ready, api, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
