import { site } from '@/lib/site';

/**
 * TEMPLATE policy text. It must be reviewed and completed by the client (ideally with a
 * lawyer) before launch. Payment gateways such as Razorpay require all four pages to be live.
 */
export interface Policy {
  title: string;
  description: string;
  sections: { heading: string; body: string[] }[];
}

const updated = '1 October 2026';

export const policies: Record<string, Policy> = {
  shipping: {
    title: 'Shipping policy',
    description: `How and where ${site.name} delivers, delivery charges and timelines.`,
    sections: [
      {
        heading: 'Where we deliver',
        body: [
          'We currently deliver within selected pincodes in Baramati and Pune. Enter your pincode at checkout to confirm we deliver to you.',
        ],
      },
      {
        heading: 'Delivery charges',
        body: [
          `Delivery is free on orders above ₹${site.freeDeliveryAbove}. A flat delivery fee applies to smaller orders and is shown at checkout before you pay.`,
        ],
      },
      {
        heading: 'Delivery times',
        body: [
          'Orders placed before 2:00 pm are usually delivered the same day. Orders placed later are delivered the next day.',
          'During festivals delivery times may be longer; we will contact you if your order is delayed.',
        ],
      },
      {
        heading: 'Store pickup',
        body: [
          'You can choose to collect your order from our store at no extra charge. We will notify you when it is ready.',
        ],
      },
    ],
  },
  refund: {
    title: 'Cancellation & refund policy',
    description: `When orders can be cancelled and how refunds work at ${site.name}.`,
    sections: [
      {
        heading: 'Cancelling an order',
        body: [
          'You can cancel your order from “My orders” until we start preparing it. Once an order is being prepared it cannot be cancelled, as our sweets are made fresh for you.',
        ],
      },
      {
        heading: 'Returns',
        body: ['Because our products are perishable food items, we do not accept returns.'],
      },
      {
        heading: 'Damaged or incorrect items',
        body: [
          `If your order arrives damaged, incomplete or incorrect, contact us within 24 hours of delivery at ${site.contact.phone} or ${site.contact.email} with a photo of the item. We will replace it or refund you in full.`,
        ],
      },
      {
        heading: 'Refund timelines',
        body: [
          'Approved refunds for online payments are issued to the original payment method within 5–7 working days.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms & conditions',
    description: `Terms governing use of the ${site.name} website and purchases made on it.`,
    sections: [
      {
        heading: 'About these terms',
        body: [
          `These terms apply to your use of ${site.url} and any order you place with ${site.name}. By placing an order you agree to them.`,
        ],
      },
      {
        heading: 'Products and pricing',
        body: [
          'All prices are in Indian Rupees and include GST. Product images are for illustration; handmade sweets may vary slightly in shape and colour.',
          'We may change prices or withdraw products at any time, but changes will not affect orders already confirmed.',
        ],
      },
      {
        heading: 'Orders',
        body: [
          'An order is confirmed once you receive a confirmation. We may cancel an order if an item becomes unavailable, in which case you will receive a full refund.',
        ],
      },
      {
        heading: 'Allergens',
        body: [
          'Our kitchen handles milk, nuts, wheat and other allergens. Please read the allergen information on each product before ordering.',
        ],
      },
      {
        heading: 'Governing law',
        body: [
          'These terms are governed by the laws of India and subject to the jurisdiction of the courts of Pune, Maharashtra.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    description: `How ${site.name} collects, uses and protects your personal information.`,
    sections: [
      {
        heading: 'What we collect',
        body: [
          'When you create an account or place an order we collect your name, email, phone number and delivery address. We do not store your card or UPI details; payments are handled by our payment partner.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To process and deliver your orders, contact you about them, and, only if you subscribe, send you offers and updates.',
        ],
      },
      {
        heading: 'Sharing',
        body: [
          'We share your details only with delivery and payment partners as needed to fulfil your order. We never sell your data.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          `You can unsubscribe from emails at any time, or ask us to delete your account by writing to ${site.contact.email}.`,
        ],
      },
    ],
  },
};

export const policiesUpdated = updated;
