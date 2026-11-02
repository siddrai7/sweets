'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Bottom sheet on phones, centred dialog from `sm` up. Portalled to <body> so it is never
 * clipped or offset by a transformed ancestor (e.g. a hovering product card).
 */
export function Sheet({ open, onClose, title, children, footer }: Props) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-cocoa/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex max-h-[88vh] w-full animate-slide-up flex-col rounded-t-[1.75rem] bg-brand-50 shadow-float sm:max-w-md sm:animate-rise sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-brand-300 sm:hidden" />
        <header className="flex items-center justify-between gap-4 px-5 pb-3 pt-3 sm:pt-5">
          <h2 id={titleId} className="text-xl font-medium">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 rounded-full p-2 text-cocoa-soft transition hover:bg-brand-100 hover:text-cocoa"
          >
            <CloseIcon size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div className="border-t border-brand-200 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
