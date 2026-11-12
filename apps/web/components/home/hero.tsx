import Link from 'next/link';
import { LogoBadge } from '@/components/layout/logo';
import { ArrowRight } from '@/components/ui/icons';
import { site } from '@/lib/site';

const FACTS = [
  ['100%', 'pure desi ghee'],
  ['Zero', 'preservatives'],
  ['Same day', 'delivery'],
] as const;

/** Rangoli ring drawn behind the logo. */
function Rings({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {[98, 86, 74].map((r) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.35"
          strokeDasharray={r === 86 ? '1 3' : undefined}
        />
      ))}
      {Array.from({ length: 32 }, (_, i) => (
        <circle
          key={i}
          cx={100 + Math.cos((i / 32) * Math.PI * 2) * 92}
          cy={100 + Math.sin((i / 32) * Math.PI * 2) * 92}
          r="1.1"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/** The brand moment: the logo's own maroon, edge to edge, with the badge as the picture. */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-800 text-brand-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_75%_45%,rgb(163_34_47/0.55),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-900/70 to-transparent" />

      <div className="container-page relative grid items-center gap-6 pb-12 pt-8 sm:pb-16 sm:pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pb-24 lg:pt-20">
        <div className="relative order-first mx-auto flex items-center justify-center lg:order-last">
          <Rings className="pointer-events-none absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2 text-saffron-400/30" />
          <div className="pointer-events-none absolute inset-6 rounded-full bg-saffron-400/20 blur-3xl" />
          <span className="relative block h-48 animate-rise sm:h-72 lg:h-[26rem]">
            <LogoBadge
              size={416}
              fluid
              priority
              className="drop-shadow-[0_24px_40px_rgb(0_0_0/0.45)]"
            />
          </span>
        </div>

        <div className="animate-rise">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-saffron-300">
            <span className="h-px w-8 bg-saffron-400" />
            Now delivering in {site.delivery.area}
          </p>
          <h1 className="mt-5 text-[2.6rem] font-light leading-[1] tracking-[-0.02em] text-white sm:text-6xl lg:text-[4.1rem] xl:text-[4.5rem]">
            Sweets and snacks, made <em className="font-normal text-saffron-300">fresh</em> in small
            batches.
          </h1>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-brand-200 sm:text-lg">
            Mithai, namkeen and tea-time snacks cooked in pure desi ghee with nothing artificial,
            and delivered the day they are made.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/shop?tag=bestseller" className="btn-gold group px-7 py-3.5">
              Shop bestsellers
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center rounded-full border border-saffron-300/50 px-7 py-3.5 text-sm font-semibold text-saffron-100 transition duration-200 hover:border-saffron-300 hover:bg-white/5 active:scale-[0.98]"
            >
              Browse the menu
            </Link>
          </div>

          <dl className="mt-9 grid max-w-md grid-cols-3 divide-x divide-white/15 border-y border-white/15 py-4">
            {FACTS.map(([value, label]) => (
              <div key={label} className="px-3 first:pl-0">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-xl text-white sm:text-2xl">{value}</dd>
                <dd className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-300 sm:text-xs">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
