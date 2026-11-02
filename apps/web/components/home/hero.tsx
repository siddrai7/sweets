import Link from 'next/link';
import { SweetArt } from '@/components/art/sweet-art';
import { ArrowRight, StarIcon } from '@/components/ui/icons';
import { heroFeatures } from '@/content/home';
import { artFor } from '@/lib/art';
import { site } from '@/lib/site';

/** Circular "made fresh today" seal with text set on a path. */
function FreshSeal() {
  const text = `MADE FRESH EVERY MORNING · SINCE ${site.established} · `;
  return (
    <div className="relative h-28 w-28 sm:h-32 sm:w-32">
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full animate-[spin_24s_linear_infinite]"
      >
        <defs>
          <path id="seal-path" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="#2d0a10" />
        <text fill="#e8c987" fontSize="9.2" fontWeight="700" letterSpacing="2.4">
          <textPath href="#seal-path">{text}</textPath>
        </text>
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-center font-display text-saffron-300">
        <span className="text-[0.6rem] font-sans font-bold uppercase tracking-[0.2em]">Est.</span>
        <span className="text-2xl italic leading-none">{site.established}</span>
      </span>
    </div>
  );
}

export function Hero() {
  const [main, ...minor] = heroFeatures;
  // Rounded down to the nearest five, e.g. "35+".
  const years = Math.floor((new Date().getFullYear() - Number(site.established)) / 5) * 5;

  return (
    <section className="relative overflow-hidden">
      {/* Soft saffron glow and a faint rangoli ring behind the composition. */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-saffron-100/70 blur-3xl" />
      <svg
        className="pointer-events-none absolute -left-40 top-10 hidden h-[36rem] w-[36rem] text-saffron-400/25 lg:block"
        viewBox="0 0 200 200"
        aria-hidden
      >
        {[96, 80, 64].map((r) => (
          <circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.4"
            strokeDasharray={r === 80 ? '1 3' : undefined}
          />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <circle
            key={i}
            cx={100 + Math.cos((i / 24) * Math.PI * 2) * 88}
            cy={100 + Math.sin((i / 24) * Math.PI * 2) * 88}
            r="1.6"
            fill="currentColor"
          />
        ))}
      </svg>

      <div className="container-page relative grid items-center gap-10 pb-10 pt-6 sm:pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-20 lg:pt-14">
        <div className="animate-rise">
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-saffron-400" />
            Thane&apos;s mithaiwala since {site.established}
          </p>
          <h1 className="mt-5 text-[2.7rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-7xl lg:text-[5.4rem]">
            Mithai, made <em className="font-normal text-brand-600">fresh</em>
            <br className="hidden sm:block" /> every morning.
          </h1>
          <p className="mt-4 max-w-md text-[0.95rem] sm:mt-6 sm:text-lg leading-relaxed text-cocoa-soft">
            Pure desi ghee, family recipes and karigars with decades at the kadhai, delivered to
            your door in {site.delivery.eta}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
            <Link href="/shop?tag=bestseller" className="btn-primary group px-7 py-3.5">
              Shop bestsellers
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link href="/shop/dry-fruit-sweets" className="btn-ghost px-7 py-3.5">
              Gift boxes
            </Link>
          </div>

          <dl className="mt-8 grid sm:mt-10 max-w-md grid-cols-3 divide-x divide-brand-200 border-y border-brand-200 py-4">
            {[
              [`${years}+`, 'years of recipes'],
              ['100%', 'pure desi ghee'],
              [site.delivery.eta.replace(' min', ''), 'minute delivery'],
            ].map(([value, label]) => (
              <div key={label} className="px-3 first:pl-0">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl sm:text-3xl">{value}</dd>
                <dd className="text-[0.7rem] font-semibold uppercase tracking-wider text-cocoa-soft">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Bento still-life composition. */}
        <div className="relative grid h-72 grid-cols-[1.35fr_1fr] grid-rows-2 gap-3 sm:h-[28rem] sm:gap-4 lg:h-[34rem]">
          {main && (
            <Link
              href={`/products/${main.slug}`}
              className="group relative row-span-2 overflow-hidden rounded-[2rem] shadow-card"
              style={{ backgroundColor: artFor(main.slug).tone.bg }}
            >
              <SweetArt
                spec={artFor(main.slug)}
                fit="meet"
                className="absolute inset-0 h-full w-full -translate-y-6 scale-125 transition duration-700 group-hover:scale-[1.3]"
              />
              <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-2xl bg-white/85 px-4 py-3 backdrop-blur-md">
                <span>
                  <span className="block font-display text-lg leading-tight">{main.name}</span>
                  {main.note && (
                    <span className="flex items-center gap-1 text-xs text-cocoa-soft">
                      <StarIcon size={12} className="text-saffron-500" /> {main.note}
                    </span>
                  )}
                </span>
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          )}
          {minor.map((f) => (
            <Link
              key={f.slug}
              href={`/products/${f.slug}`}
              className="group relative overflow-hidden rounded-[1.6rem] bg-white shadow-card"
            >
              <SweetArt
                spec={artFor(f.slug)}
                className="h-full w-full transition duration-700 group-hover:scale-105"
              />
              <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/85 px-3 py-1 text-xs font-bold backdrop-blur-md">
                {f.name}
              </span>
            </Link>
          ))}
          <div className="absolute -left-4 -top-6 hidden sm:block lg:-left-10 lg:top-1/2 lg:-translate-y-1/2">
            <FreshSeal />
          </div>
        </div>
      </div>
    </section>
  );
}
