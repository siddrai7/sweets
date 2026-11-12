import Link from 'next/link';
import { BoltIcon, GiftIcon, SunIcon, TruckIcon } from '@/components/ui/icons';
import { site } from '@/lib/site';

const STEPS = [
  {
    icon: SunIcon,
    title: 'Made fresh',
    body: 'Cooked in small batches, so your sweets are hours old, not days.',
  },
  {
    icon: GiftIcon,
    title: 'Packed with care',
    body: 'Tamper-proof, food-grade boxes that keep every piece intact.',
  },
  {
    icon: TruckIcon,
    title: 'At your door the same day',
    body: `Order before ${site.delivery.sameDayCutoff}. We deliver across ${site.delivery.area}.`,
  },
];

export function DeliverySteps() {
  return (
    <section className="container-page py-10 sm:py-14">
      <div className="grid gap-8 rounded-[2rem] bg-saffron-100/70 p-6 ring-1 ring-saffron-300/40 sm:p-10 lg:grid-cols-[0.9fr_1.6fr] lg:items-center lg:gap-14 lg:p-14">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <BoltIcon size={14} /> Fresh to your door
          </p>
          <h2 className="mt-3 text-[2rem] font-light leading-[1.05] sm:text-[2.75rem]">
            From our kitchen to your table, <em className="text-brand-600">the same day.</em>
          </h2>
          <p className="mt-4 text-cocoa-soft">
            Order before {site.delivery.sameDayCutoff} for same-day delivery. Free on orders above ₹
            {site.freeDeliveryAbove}.
          </p>
          <Link href="/shop" className="btn-primary mt-7">
            Start your order
          </Link>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="relative flex items-start gap-4 rounded-[1.4rem] bg-white p-4 shadow-card sm:block sm:p-5"
            >
              <span className="w-7 shrink-0 font-display text-4xl font-light italic leading-none text-saffron-400 sm:w-auto sm:text-5xl">
                {i + 1}
              </span>
              <span className="absolute right-5 top-5 hidden h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 sm:flex">
                <Icon size={20} />
              </span>
              <div>
                <h3 className="font-sans text-base font-bold sm:mt-3">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-cocoa-soft sm:mt-1.5">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
