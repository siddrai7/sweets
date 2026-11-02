import { promises } from '@/content/home';
import { DropIcon, HandIcon, LeafIcon, SunIcon } from '@/components/ui/icons';
import { site } from '@/lib/site';

const ICONS = { sun: SunIcon, drop: DropIcon, leaf: LeafIcon, hand: HandIcon };

export function Promises() {
  return (
    <section className="my-12 bg-brand-100">
      <div className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron-600">
            Since {site.established}
          </p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
            The taste of tradition, made honestly
          </h2>
          <p className="mt-4 text-cocoa-soft">
            For over three decades we have made our sweets the way they were meant to be made: by
            hand, in small batches, every single morning.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((p) => {
            const Icon = ICONS[p.icon];
            return (
              <div key={p.title} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 text-saffron-600">
                  <Icon size={26} />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa-soft">{p.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
