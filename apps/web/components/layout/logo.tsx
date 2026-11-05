import Link from 'next/link';
import { site } from '@/lib/site';

/** Rangoli-inspired monogram. Replace with the client's mark when it exists. */
export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="19" fill="currentColor" />
      <circle cx="20" cy="20" r="16.2" fill="none" stroke="#d9ae5b" strokeWidth="0.8" />
      {petals.map((a) => (
        <path
          key={a}
          d="M20 8.5c1.9 2.6 1.9 5.2 0 7.6-1.9-2.4-1.9-5 0-7.6Z"
          fill="#e8c987"
          transform={`rotate(${a} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="2.6" fill="#e8c987" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <LogoMark
        size={compact ? 32 : 38}
        className="shrink-0 text-brand-600 transition duration-500 group-hover:rotate-45"
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-medium tracking-tight text-cocoa ${compact ? 'text-[1.3rem]' : 'text-[1.55rem]'}`}
        >
          {site.name}
        </span>
        <span
          aria-hidden
          className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.32em] text-saffron-600"
        >
          Est. {site.established} · Mithaiwala
        </span>
      </span>
    </Link>
  );
}
