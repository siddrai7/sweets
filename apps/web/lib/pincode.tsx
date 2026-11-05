'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PincodeCheck } from '@sweets/types';
import { browserApi } from './browser-api';

const KEY = 'sweets.pincode';

interface PincodeContext {
  /** The customer's chosen pincode and whether we deliver there. */
  current: PincodeCheck | null;
  check: (pincode: string) => Promise<PincodeCheck>;
  clear: () => void;
}

const Ctx = createContext<PincodeContext | null>(null);

/** Remembers the delivery pincode a customer checked, for the header and product pages. */
export function PincodeProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<PincodeCheck | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCurrent(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const check = useCallback(async (pincode: string) => {
    const result = await browserApi.delivery.check(pincode);
    setCurrent(result);
    try {
      localStorage.setItem(KEY, JSON.stringify(result));
    } catch {
      /* storage unavailable */
    }
    return result;
  }, []);

  const clear = useCallback(() => {
    setCurrent(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  return <Ctx.Provider value={{ current, check, clear }}>{children}</Ctx.Provider>;
}

export function usePincode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePincode must be used inside <PincodeProvider>');
  return ctx;
}
