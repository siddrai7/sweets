import { testimonials } from '@/content/home';
import { QuoteIcon } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/section-heading';

export function Testimonials() {
  return (
    <section className="container-page py-12 sm:py-16">
      <SectionHeading
        align="center"
        eyebrow="Loved by families"
        title={
          <>
            Kind words from <em className="text-brand-600">our customers</em>
          </>
        }
      />
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="flex w-[82%] shrink-0 snap-start flex-col rounded-[1.6rem] bg-white p-6 ring-1 ring-brand-200 sm:w-[46%] lg:w-auto"
          >
            <QuoteIcon size={28} className="text-saffron-400" />
            <blockquote className="mt-4 flex-1 font-display text-[1.05rem] leading-relaxed text-cocoa">
              {t.quote}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-brand-100 pt-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-display text-brand-600">
                {t.name.charAt(0)}
              </span>
              <span>
                <span className="block text-sm font-bold">{t.name}</span>
                <span className="text-xs text-cocoa-soft">{t.place}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
