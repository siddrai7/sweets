import type { Metadata } from 'next';
import { ContactForm } from '@/components/forms/contact-form';
import { Breadcrumbs } from '@/components/shop/breadcrumbs';
import { ClockIcon, MailIcon, PhoneIcon, PinIcon } from '@/components/ui/icons';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact us',
  description: `Get in touch with ${site.name} for orders, bulk and corporate gifting, or feedback.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  const details = [
    {
      icon: PhoneIcon,
      label: 'Call us',
      value: site.contact.phone,
      href: `tel:${site.contact.phone.replace(/\s/g, '')}`,
    },
    {
      icon: MailIcon,
      label: 'Email',
      value: site.contact.email,
      href: `mailto:${site.contact.email}`,
    },
    { icon: PinIcon, label: 'Visit', value: site.contact.address },
    { icon: ClockIcon, label: 'Hours', value: site.contact.hours },
  ];

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Contact', href: '/contact' }]} />
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <h1 className="text-4xl font-light leading-[1.05] sm:text-6xl">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-4 text-lg text-cocoa-soft">
            Questions about an order, planning a wedding or festive gifting, or just want to say
            hello? Drop us a message.
          </p>
          <ul className="mt-10 space-y-6">
            {details.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-saffron-600">
                  <Icon />
                </span>
                <div>
                  <p className="text-sm text-cocoa-soft">{label}</p>
                  {href ? (
                    <a href={href} className="font-semibold hover:text-brand-600">
                      {value}
                    </a>
                  ) : (
                    <p className="font-semibold">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-brand-200 bg-white p-6 sm:p-10">
          <h2 className="mb-6 text-2xl font-normal">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
