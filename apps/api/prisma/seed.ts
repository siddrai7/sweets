/**
 * Development seed: an admin, a kitchen + store, a few categories and sweets with stock.
 * Safe to re-run — everything is upserted by a natural key.
 */
import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type SeedVariant = {
  sku: string;
  label: string;
  weightGrams?: number;
  price: string;
  mrp?: string;
};
type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  shelfLifeDays: number;
  ingredients: string;
  allergens?: string;
  /** Curated homepage collections: bestseller, favourite, classic. */
  tags?: string[];
  isFeatured?: boolean;
  variants: SeedVariant[];
};
type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  children?: { name: string; slug: string; products: SeedProduct[] }[];
  products?: SeedProduct[];
};

/** Standard weight ladder for mithai sold loose by weight (price is per kg). */
function byWeight(prefix: string, perKg: number): SeedVariant[] {
  return [
    {
      sku: `${prefix}-250`,
      label: '250 g',
      weightGrams: 250,
      price: String(Math.round(perKg / 4)),
    },
    {
      sku: `${prefix}-500`,
      label: '500 g',
      weightGrams: 500,
      price: String(Math.round(perKg / 2)),
    },
    { sku: `${prefix}-1000`, label: '1 kg', weightGrams: 1000, price: String(perKg) },
  ];
}

const MILK = 'Contains milk. Made in a kitchen that also handles nuts, wheat and soy.';
const NUTS = 'Contains milk and tree nuts. Made in a kitchen that also handles wheat and soy.';

const catalog: SeedCategory[] = [
  {
    name: 'Desi Sweets',
    slug: 'desi-sweets',
    description: 'Traditional mithai made fresh every morning in pure ghee.',
    children: [
      {
        name: 'Ladoo',
        slug: 'ladoo',
        products: [
          {
            name: 'Motichoor Ladoo',
            slug: 'motichoor-ladoo',
            shelfLifeDays: 7,
            tags: ['bestseller', 'classic'],
            isFeatured: true,
            description:
              'Tiny pearls of gram-flour boondi fried in ghee, soaked in saffron syrup and rolled by hand. Soft, fragrant and melt-in-the-mouth.',
            ingredients: 'Gram flour, sugar, pure ghee, saffron, cardamom, melon seeds',
            allergens: MILK,
            variants: byWeight('MTL', 640),
          },
          {
            name: 'Besan Ladoo',
            slug: 'besan-ladoo',
            shelfLifeDays: 15,
            tags: ['favourite'],
            description:
              'Slow-roasted gram flour and ghee, sweetened and scented with cardamom. A grandmother-style recipe with a nutty, grainy bite.',
            ingredients: 'Gram flour, pure ghee, powdered sugar, cardamom, almonds',
            allergens: NUTS,
            variants: byWeight('BSL', 720),
          },
          {
            name: 'Dry Fruit Ladoo',
            slug: 'dry-fruit-ladoo',
            shelfLifeDays: 20,
            tags: ['favourite'],
            description:
              'No added sugar. Dates, figs and a generous mix of nuts bound together for a wholesome, energy-rich treat.',
            ingredients: 'Dates, figs, almonds, cashews, pistachios, walnuts, pure ghee',
            allergens: NUTS,
            variants: byWeight('DFL', 1400),
          },
        ],
      },
      {
        name: 'Barfi',
        slug: 'barfi',
        products: [
          {
            name: 'Milk Cake',
            slug: 'milk-cake',
            shelfLifeDays: 5,
            tags: ['classic', 'bestseller'],
            description:
              'Caramelised, grainy milk fudge with a golden centre, slow-cooked for hours until it sets.',
            ingredients: 'Milk, sugar, pure ghee, cardamom',
            allergens: MILK,
            variants: byWeight('MLK', 760),
          },
          {
            name: 'Kesar Barfi',
            slug: 'kesar-barfi',
            shelfLifeDays: 5,
            tags: ['favourite'],
            description:
              'Rich khoya barfi infused with Kashmiri saffron and topped with silver leaf and pistachio slivers.',
            ingredients: 'Khoya, sugar, saffron, cardamom, pistachio, edible silver leaf',
            allergens: NUTS,
            variants: byWeight('KSB', 880),
          },
          {
            name: 'Coconut Barfi',
            slug: 'coconut-barfi',
            shelfLifeDays: 4,
            description:
              'Fresh grated coconut cooked with milk and sugar into soft, chewy squares.',
            ingredients: 'Fresh coconut, milk, sugar, cardamom, pure ghee',
            allergens: MILK,
            variants: byWeight('CCB', 600),
          },
        ],
      },
      {
        name: 'Pedha',
        slug: 'pedha',
        products: [
          {
            name: 'Mathura Pedha',
            slug: 'mathura-pedha',
            shelfLifeDays: 7,
            tags: ['classic'],
            description:
              'Deeply roasted khoya with a caramel colour and a gentle crumble, finished with powdered sugar.',
            ingredients: 'Khoya, sugar, pure ghee, cardamom',
            allergens: MILK,
            variants: byWeight('MTP', 640),
          },
          {
            name: 'Kesar Pedha',
            slug: 'kesar-pedha',
            shelfLifeDays: 5,
            tags: ['bestseller'],
            description:
              'Soft saffron pedha pressed by hand, perfect for pooja offerings and celebrations.',
            ingredients: 'Khoya, sugar, saffron, cardamom, pistachio',
            allergens: NUTS,
            variants: byWeight('KSP', 720),
          },
        ],
      },
      {
        name: 'Bengali Sweets',
        slug: 'bengali-sweets',
        products: [
          {
            name: 'Rasgulla',
            slug: 'rasgulla',
            shelfLifeDays: 3,
            tags: ['classic'],
            description:
              'Spongy cottage-cheese dumplings simmered in light sugar syrup. Best served chilled.',
            ingredients: 'Chhena (cottage cheese), sugar, water, rose water',
            allergens: MILK,
            variants: [
              { sku: 'RSG-500', label: 'Tin of 500 g', weightGrams: 500, price: '220' },
              { sku: 'RSG-1000', label: 'Tin of 1 kg', weightGrams: 1000, price: '420' },
            ],
          },
          {
            name: 'Kesar Rasmalai',
            slug: 'kesar-rasmalai',
            shelfLifeDays: 2,
            tags: ['favourite', 'bestseller'],
            isFeatured: true,
            description:
              'Delicate chhena discs soaked in thickened saffron milk with pistachio and almond.',
            ingredients: 'Chhena, milk, sugar, saffron, pistachio, almonds, cardamom',
            allergens: NUTS,
            variants: [
              { sku: 'RML-4', label: '4 pieces', price: '180' },
              { sku: 'RML-8', label: '8 pieces', price: '340' },
            ],
          },
        ],
      },
      {
        name: 'Halwa',
        slug: 'halwa',
        products: [
          {
            name: 'Moong Dal Halwa',
            slug: 'moong-dal-halwa',
            shelfLifeDays: 4,
            tags: ['favourite'],
            description: 'Lentils slow-roasted in ghee for hours until rich, glossy and aromatic.',
            ingredients: 'Moong dal, pure ghee, sugar, milk, almonds, cardamom',
            allergens: NUTS,
            variants: byWeight('MDH', 960),
          },
        ],
      },
    ],
  },
  {
    name: 'Dry Fruit Sweets',
    slug: 'dry-fruit-sweets',
    description: 'Premium sweets made with cashew, almond, pistachio and figs.',
    children: [
      {
        name: 'Katli',
        slug: 'katli',
        products: [
          {
            name: 'Kaju Katli',
            slug: 'kaju-katli',
            shelfLifeDays: 15,
            tags: ['bestseller', 'classic'],
            isFeatured: true,
            description:
              'Our signature. Smooth, thin diamonds of ground cashew with a whisper of cardamom and silver leaf.',
            ingredients: 'Cashews, sugar, pure ghee, edible silver leaf',
            allergens: NUTS,
            variants: byWeight('KAJ', 1280),
          },
          {
            name: 'Pista Katli',
            slug: 'pista-katli',
            shelfLifeDays: 15,
            description: 'Vibrant green katli made from premium Iranian pistachios.',
            ingredients: 'Pistachios, cashews, sugar, pure ghee',
            allergens: NUTS,
            variants: byWeight('PSK', 1800),
          },
        ],
      },
      {
        name: 'Sugar-free',
        slug: 'sugar-free',
        products: [
          {
            name: 'Anjeer Roll',
            slug: 'anjeer-roll',
            shelfLifeDays: 20,
            tags: ['favourite'],
            description: 'Figs and dates rolled around a crunchy nut filling. No added sugar.',
            ingredients: 'Figs, dates, almonds, cashews, pistachios, pure ghee',
            allergens: NUTS,
            variants: byWeight('ANR', 1600),
          },
        ],
      },
    ],
  },
  {
    name: 'Namkeen',
    slug: 'namkeen',
    description: 'Crunchy savoury snacks to go with your evening chai.',
    products: [
      {
        name: 'Aloo Bhujia',
        slug: 'aloo-bhujia',
        shelfLifeDays: 60,
        tags: ['bestseller'],
        description: 'Thin, crispy potato and gram-flour sev with a gentle spice kick.',
        ingredients: 'Gram flour, potato, edible oil, spices, salt',
        variants: byWeight('ALB', 480),
      },
      {
        name: 'Khatta Meetha Mix',
        slug: 'khatta-meetha-mix',
        shelfLifeDays: 60,
        description: 'Sweet, sour and spicy mixture with peanuts, raisins and crunchy sev.',
        ingredients: 'Gram flour, peanuts, raisins, sugar, edible oil, spices',
        allergens: 'Contains peanuts.',
        variants: byWeight('KMM', 440),
      },
    ],
  },
  {
    name: 'Snacks',
    slug: 'snacks',
    description: 'Fresh savouries made daily in our kitchen.',
    products: [
      {
        name: 'Khasta Kachori',
        slug: 'khasta-kachori',
        shelfLifeDays: 3,
        tags: ['favourite'],
        description: 'Flaky, golden kachori stuffed with spiced moong dal.',
        ingredients: 'Wheat flour, moong dal, edible oil, spices, salt',
        allergens: 'Contains wheat (gluten).',
        variants: [
          { sku: 'KCH-4', label: '4 pieces', price: '100' },
          { sku: 'KCH-12', label: '12 pieces', price: '280' },
        ],
      },
      {
        name: 'Khaman Dhokla',
        slug: 'khaman-dhokla',
        shelfLifeDays: 1,
        description:
          'Soft, spongy steamed gram-flour cake tempered with mustard seeds and curry leaves.',
        ingredients: 'Gram flour, curd, sugar, mustard seeds, curry leaves, green chilli',
        allergens: MILK,
        variants: byWeight('DHK', 360),
      },
    ],
  },
  {
    name: 'Bakery',
    slug: 'bakery',
    description: 'Cookies and bakes made with butter and real ingredients.',
    children: [
      {
        name: 'Cookies',
        slug: 'cookies',
        products: [
          {
            name: 'Butter Cookies',
            slug: 'butter-cookies',
            shelfLifeDays: 30,
            tags: ['bestseller'],
            description: 'Crisp, golden cookies made with real butter. A tea-time essential.',
            ingredients: 'Wheat flour, butter, sugar, milk solids, vanilla',
            allergens: 'Contains wheat (gluten) and milk.',
            variants: [
              { sku: 'BTC-200', label: '200 g box', weightGrams: 200, price: '160' },
              { sku: 'BTC-400', label: '400 g box', weightGrams: 400, price: '300' },
            ],
          },
          {
            name: 'Almond Biscotti',
            slug: 'almond-biscotti',
            shelfLifeDays: 45,
            description: 'Twice-baked crunchy biscotti packed with whole almonds.',
            ingredients: 'Wheat flour, almonds, sugar, butter, eggless',
            allergens: 'Contains wheat (gluten), milk and tree nuts.',
            variants: [{ sku: 'ABS-200', label: '200 g box', weightGrams: 200, price: '220' }],
          },
        ],
      },
    ],
  },
];

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!'),
    },
  });

  const kitchen =
    (await prisma.location.findFirst({ where: { name: 'Main Kitchen' } })) ??
    (await prisma.location.create({ data: { name: 'Main Kitchen', type: 'KITCHEN' } }));
  if (!(await prisma.location.findFirst({ where: { name: 'Flagship Store' } }))) {
    await prisma.location.create({ data: { name: 'Flagship Store', type: 'STORE' } });
  }

  const seedProducts = async (categoryId: string, products: SeedProduct[]) => {
    for (const { variants, ...p } of products) {
      const product = await prisma.product.upsert({
        where: { slug: p.slug },
        update: {},
        create: {
          ...p,
          categoryId,
          hsnCode: '1704',
          taxRatePercent: 5,
          basePrice: String(Math.min(...variants.map((v) => Number(v.price)))),
          storageInstructions:
            p.shelfLifeDays <= 5
              ? 'Refrigerate after opening and consume within the shelf life.'
              : 'Store in an airtight container in a cool, dry place.',
        },
      });
      for (const [j, v] of variants.entries()) {
        const variant = await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: {},
          create: { ...v, productId: product.id, sortOrder: j },
        });
        if (await prisma.stockBatch.count({ where: { variantId: variant.id } })) continue;
        const producedAt = new Date();
        const batch = await prisma.stockBatch.create({
          data: {
            variantId: variant.id,
            locationId: kitchen.id,
            batchCode: `SEED-${v.sku}`,
            quantity: 25,
            initialQuantity: 25,
            producedAt,
            expiresAt: new Date(producedAt.getTime() + p.shelfLifeDays * 86_400_000),
          },
        });
        await prisma.stockMovement.create({
          data: {
            type: 'PRODUCTION',
            variantId: variant.id,
            batchId: batch.id,
            locationId: kitchen.id,
            quantity: 25,
            note: 'Seed',
          },
        });
      }
    }
  };

  for (const [i, { children, products, ...category }] of catalog.entries()) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { ...category, sortOrder: i },
    });
    if (products) await seedProducts(parent.id, products);
    for (const [j, { products: childProducts, ...child }] of (children ?? []).entries()) {
      const sub = await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: { ...child, parentId: parent.id, sortOrder: j },
      });
      await seedProducts(sub.id, childProducts);
    }
  }

  const vendor =
    (await prisma.vendor.findFirst({ where: { name: 'Shree Dairy Suppliers' } })) ??
    (await prisma.vendor.create({
      data: { name: 'Shree Dairy Suppliers', contactName: 'Ramesh', phone: '9800000000' },
    }));
  for (const rm of [
    { name: 'Khoya', unit: 'KG' as const, reorderLevel: 10 },
    { name: 'Sugar', unit: 'KG' as const, reorderLevel: 25 },
    { name: 'Ghee', unit: 'L' as const, reorderLevel: 10 },
    { name: 'Cashew', unit: 'KG' as const, reorderLevel: 5 },
  ]) {
    await prisma.rawMaterial.upsert({ where: { name: rm.name }, update: {}, create: rm });
  }

  console.log(`Seeded. Admin: ${email}  Vendor: ${vendor.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
