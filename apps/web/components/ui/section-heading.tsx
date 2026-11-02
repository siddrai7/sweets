import Link from 'next/link';
import { ArrowRight } from './icons';

/** Section title with an optional eyebrow, subtitle and "See all" link. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  action = 'See all',
  align = 'left',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  href?: string;
  action?: string;
  align?: 'left' | 'center';
}) {
  if (align === 'center') {
    return (
      <div className="mx-auto mb-10 max-w-2xl text-center">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-3 text-[2rem] font-normal leading-[1.08] sm:text-5xl">{title}</h2>
        {subtitle && <p className="mt-4 text-cocoa-soft sm:text-lg">{subtitle}</p>}
      </div>
    );
  }
  return (
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-[1.6rem] font-normal leading-tight sm:text-[2.4rem]">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-cocoa-soft sm:text-base">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1.5 rounded-full py-1 text-sm font-bold text-brand-600"
        >
          {action}
          <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
