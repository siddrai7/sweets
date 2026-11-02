import Link from 'next/link';
import { SweetArt } from '@/components/art/sweet-art';
import { promises } from '@/content/home';
import { ArrowRight, DropIcon, HandIcon, LeafIcon, SunIcon } from '@/components/ui/icons';
import { artFor } from '@/lib/art';
import { site } from '@/lib/site';

const ICONS = { sun: SunIcon, drop: DropIcon, leaf: LeafIcon, hand: HandIcon };

/** Dark heritage band: why the sweets are different. */
export function Promises({ showLink = true }: { showLink?: boolean }) {
  return (
    <section className="my-10 sm:my-16">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-12 text-brand-100 sm:px-12 sm:py-16 lg:px-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
          <SweetArt
            spec={artFor('besan-ladoo')}
            background={false}
            className="pointer-events-none absolute -bottom-16 -right-16 hidden h-80 w-80 opacity-90 lg:block"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-saffron-400">
                Since {site.established}
              </p>
              <h2 className="mt-4 text-[2.1rem] font-light leading-[1.05] text-white sm:text-5xl">
                The taste of tradition, <em className="text-saffron-300">made honestly.</em>
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-brand-300">
                For over three decades we have made our sweets the way they were meant to be made:
                by hand, in small batches, every single morning.
              </p>
              {showLink && (
                <Link
                  href="/our-story"
                  className="group mt-8 inline-flex items-center gap-2 border-b border-saffron-400/60 pb-1 text-sm font-bold text-saffron-300"
                >
                  Read our story
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </Link>
              )}
            </div>
            <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:pr-40">
              {promises.map((p, i) => {
                const Icon = ICONS[p.icon];
                return (
                  <li key={p.title} className="border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-saffron-400/40 text-saffron-300">
                        <Icon size={20} />
                      </span>
                      <span className="font-display text-sm italic text-brand-400">0{i + 1}</span>
                    </div>
                    <h3 className="mt-4 text-xl text-white">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-300">{p.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
