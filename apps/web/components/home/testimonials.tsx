import { testimonials } from '@/content/home';
import { QuoteIcon } from '@/components/ui/icons';

export function Testimonials() {
  return (
    <section className="container-page py-14">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron-600">
          Loved by families
        </p>
        <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">What our customers say</h2>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="flex w-[85%] shrink-0 snap-start flex-col rounded-2xl border border-brand-200 bg-white p-6 sm:w-[45%] lg:w-auto"
          >
            <QuoteIcon size={28} className="text-saffron-400" />
            <blockquote className="mt-4 flex-1 leading-relaxed text-cocoa">{t.quote}</blockquote>
            <figcaption className="mt-6 border-t border-brand-100 pt-4">
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-cocoa-soft">{t.place}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
