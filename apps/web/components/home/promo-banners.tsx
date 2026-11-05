import Link from 'next/link';
import { ArtImage } from '@/components/art/art-image';
import { ArrowRight } from '@/components/ui/icons';
import { banners, type Banner } from '@/content/home';

const TONES: Record<Banner['tone'], { card: string; eyebrow: string; body: string; cta: string }> =
  {
    wine: {
      card: 'bg-brand-700 text-white',
      eyebrow: 'text-saffron-300',
      body: 'text-white/75',
      cta: 'bg-white text-cocoa',
    },
    pista: {
      card: 'bg-pista-100 text-cocoa',
      eyebrow: 'text-pista-600',
      body: 'text-cocoa-soft',
      cta: 'bg-cocoa text-white',
    },
    saffron: {
      card: 'bg-saffron-100 text-cocoa',
      eyebrow: 'text-saffron-600',
      body: 'text-cocoa-soft',
      cta: 'bg-cocoa text-white',
    },
  };

export function PromoBanners() {
  return (
    <section className="container-page py-4 sm:py-6">
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
        {banners.map((b) => {
          const t = TONES[b.tone];
          return (
            <li key={b.title} className="w-[84%] shrink-0 snap-start sm:w-auto">
              <Link
                href={b.cta.href}
                className={`group relative flex h-full min-h-52 overflow-hidden rounded-[1.6rem] p-5 sm:p-6 ${t.card}`}
              >
                <div className="relative z-10 flex max-w-[60%] flex-col">
                  <p className={`text-xs font-bold uppercase tracking-[0.24em] ${t.eyebrow}`}>
                    {b.eyebrow}
                  </p>
                  <h3 className="mt-2 text-[1.45rem] font-normal leading-[1.1] sm:text-2xl">
                    {b.title}
                  </h3>
                  <p className={`mt-2 text-xs leading-relaxed sm:text-sm ${t.body}`}>{b.body}</p>
                  <span
                    className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition group-hover:gap-2.5 ${t.cta}`}
                  >
                    {b.cta.label} <ArrowRight size={14} />
                  </span>
                </div>
                <ArtImage
                  hints={[b.art]}
                  background={false}
                  className="absolute -bottom-6 -right-10 h-52 w-52 transition duration-700 group-hover:-rotate-3 group-hover:scale-105 sm:h-56 sm:w-56"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
