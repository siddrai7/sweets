# Architecture

## Overview

```
                 ┌───────────────────────────┐
 Storefront ───▶ │                           │ ──▶ PostgreSQL  (all business data)
 (Next.js, SEO)  │        NestJS API         │ ──▶ Redis       (queues/cache — Phase 2)
 Mobile app ───▶ │  /api/v1  ·  JWT + RBAC   │ ──▶ Payment gateway (Razorpay/Stripe)
 (Expo)          │                           │ ──▶ SMS / WhatsApp / email (Phase 2)
 ERP panel  ───▶ │                           │
 (Next.js)       └───────────────────────────┘
```

**One backend, many clients.** Orders, stock and customers live in one database behind one API.
The storefront, ERP and mobile app are all thin clients of the same API, sharing request/response
types (`@sweets/types`) and a typed HTTP client (`@sweets/api-client`).

## Roles

| Role       | Signs in to      | Can do                                                                   |
| ---------- | ---------------- | ------------------------------------------------------------------------ |
| `CUSTOMER` | Storefront / app | Browse, order, view and cancel own orders                                |
| `STAFF`    | ERP              | Orders, products, inventory, purchase orders                             |
| `ADMIN`    | ERP              | Everything staff can, plus users, vendors, locations, archiving products |
| `VENDOR`   | ERP              | View and acknowledge **their own** purchase orders only                  |

> **Assumption:** "vendors" are suppliers (raw materials or bought-in finished goods) who get a
> portal to see and acknowledge purchase orders. If they are franchise outlets or marketplace
> sellers instead, the `Vendor` model gains a link to `Location` or `Product` and the vendor
> permissions widen; the rest of the design holds.

Enforcement is in the API: a global `JwtAuthGuard` (every route requires auth unless `@Public()`)
and a `RolesGuard` (`@Roles(...)`). The ERP hides navigation by role, but that is only UX.

## Repository layout

```
apps/
  api/
    prisma/schema.prisma      ← the data model (single source of truth)
    prisma/migrations/        ← committed SQL migrations
    prisma/seed.ts
    src/
      common/                 ← guards, decorators, pagination, reference numbers
      config/env.ts           ← env validation (app refuses to boot on bad config)
      prisma/                 ← PrismaService (Postgres driver adapter)
      modules/
        auth/                 ← register, login, refresh rotation, logout, me
        users/                ← admin user management (team, vendor logins, customers)
        catalog/              ← categories, products, variants
        inventory/            ← locations, batches, FIFO allocation, adjustments, expiry
        orders/               ← placement, pricing, status machine
        payments/             ← gateway interface; COD implemented
        vendors/              ← vendors, raw materials, purchase orders
        dashboard/            ← ERP KPIs
  web/                        ← storefront
  erp/                        ← admin/vendor panel
  mobile/                     ← placeholder (Phase 3)
packages/
  types/                      ← zod schemas, enums, response types
  api-client/                 ← createApiClient() used by every frontend
  tsconfig/                   ← shared compiler settings
```

## Domain decisions specific to sweets

**Variants, not products, are what you sell.** "Kaju Katli" is a product; "250 g", "1 kg" and
"Gift box of 12" are `ProductVariant`s with their own SKU, price and stock.

**Stock is tracked per batch with an expiry date.** Each production run creates a `StockBatch`
(expiry defaults to `producedAt + product.shelfLifeDays`). Orders take stock **soonest-expiring
first** (`InventoryService.allocateFifo`). Expired batches are never sold, and the ERP lists
batches expiring within 48 h so they can be discounted or written off.

**Every stock change is a ledger row.** `StockMovement` is append-only (PRODUCTION, PURCHASE, SALE,
RETURN, ADJUSTMENT, WASTAGE, TRANSFER). Batch quantities are the running result, which gives a
full audit trail for wastage and theft questions.

**Stock is reserved when the order is placed**, inside the same DB transaction as the order. A
conditional decrement (`UPDATE … WHERE quantity >= n`) means two customers can't buy the last box.
Cancelling an order reverses its SALE movements back into the exact batches they came from.

**Prices are tax-inclusive** (MRP-style, normal for Indian retail). The GST portion is derived per
line (`lineTotal × rate / (100 + rate)`) and stored on the order for invoicing. `hsnCode` and
`taxRatePercent` live on the product.

**Orders snapshot everything.** Product name, variant label, SKU, price, tax rate and delivery
address are copied onto the order, so editing the catalog never changes past orders or invoices.

**Order status is a state machine** defined once in `@sweets/types`
(`ORDER_STATUS_TRANSITIONS`). The API enforces it; the ERP reads it to decide which buttons to show.
All transitions go through `OrdersService.transition()`, which also runs side effects (release
stock on cancel, mark COD collected on delivery) and writes `OrderStatusEvent` history.

```
PENDING_PAYMENT → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED → REFUNDED
        └──────────────┴────────────┴────────┴──→ CANCELLED
```

**Recipes (bill of materials)** are modelled (`RecipeItem`: raw material quantity per unit of a
variant) but not yet used to auto-deduct raw materials on production. That is Phase 2.

## Auth

- Access token: JWT, 15 min, sent as `Authorization: Bearer`.
- Refresh token: random 48 bytes, stored **hashed** (SHA-256), 30 days, rotated on every use.
  Re-using an already-rotated token revokes all of that user's sessions (theft detection).
- Passwords: argon2.
- Login/register are rate-limited (10/min per IP); the whole API is limited to 120/min.

Clients currently keep tokens in `localStorage`. Before launch, consider moving the storefront to
an httpOnly refresh cookie (needs the API and web on the same parent domain).

## Validation

Request bodies and queries are zod schemas from `@sweets/types`, turned into NestJS DTOs with
`nestjs-zod`. The same schemas can validate forms in the frontends, so the rules live in one place.
Swagger is generated from them at `/api/docs`.

Money is `Decimal` in Postgres and travels as a string in JSON (e.g. `"1024"`). Never parse it into
float math on the server; use `Prisma.Decimal`. Frontends format it with `formatMoney()`.

## Storefront

### Rendering (SEO)

| Route                                                            | Rendering                                             |
| ---------------------------------------------------------------- | ----------------------------------------------------- |
| `/`, `/products/[slug]`, `/our-story`, `/contact`, `/policies/*` | Static, revalidated every 60 s (ISR)                  |
| `/shop`, `/shop/[category]`, `/search`                           | Server-rendered per request (filters live in the URL) |
| `/sitemap.xml`                                                   | Regenerated hourly from the catalog                   |
| `/cart`, `/checkout`, `/account/*`, `/login`                     | Client-side, excluded in `robots.txt`                 |

Structured data: `Organization` (every page), `Product` + `Offer` (product pages, with price and
stock), `BreadcrumbList` (shop and product pages). Product and category pages set canonical URLs.
If the API is unreachable, pages render an empty state instead of failing (`safe()` in `lib/api.ts`).

**Catalog freshness.** Every catalog read carries the `catalog` cache tag. After any product or
category write, the API (`StorefrontCacheService`) POSTs to the storefront's `/api/revalidate`
with the shared `REVALIDATE_SECRET`, which expires the tag so the next visit renders fresh data.
This matters for correctness, not just speed: a cached page is never replaced by a 404, so
without it an archived product would stay visible. Configure `STOREFRONT_REVALIDATE_URL` and
`REVALIDATE_SECRET` on the API and the same secret on the storefront.

### Where things live (`apps/web`)

| What                                                    | Where                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| Brand colours and fonts                                 | `app/globals.css` (`@theme` tokens) + `next/font` in `app/layout.tsx` |
| Business name, phone, address, announcement bar         | `lib/site.ts`                                                         |
| Hero banners, trust points, testimonials                | `content/home.ts` (moves to the ERP later)                            |
| Policy pages (template text, needs client/legal review) | `content/policies.ts`                                                 |
| Product image or placeholder art                        | `components/product/product-image.tsx`                                |

Categories are a tree (`Category.parentId`). `/shop/<slug>` works for both levels, and filtering by
a parent includes its sub-categories. Homepage rows are driven by product tags: `bestseller`,
`favourite`, `classic`. Price filters and sorting use `Product.basePrice` (the cheapest active
variant), which `CatalogService` keeps in sync.

## Payments

`PaymentGateway` (`apps/api/src/modules/payments/gateways`) is the extension point. COD is
implemented. To add Razorpay:

1. Implement `RazorpayGateway.createIntent()` to create a Razorpay order and return its id plus
   the checkout payload.
2. Register it in `PaymentsModule`'s `PAYMENT_GATEWAYS` factory.
3. Implement `POST /payments/webhooks/razorpay`: verify the signature on the raw body, mark the
   payment `SUCCEEDED`, and transition the order `PENDING_PAYMENT → CONFIRMED`.
4. Add a scheduled job that cancels `PENDING_PAYMENT` orders older than ~15 min, which releases
   their stock.

## Roadmap

**Phase 1 (MVP), mostly in place**

- [x] Auth + RBAC, catalog, batch inventory, orders with stock reservation, COD
- [x] Storefront: catalog, product SEO, cart, checkout, order history
- [x] ERP: dashboard, order processing, stock and expiry, PO workflow, vendors
- [x] ERP user management: add team and vendor logins, edit roles, reset passwords, deactivate
- [x] ERP catalog: create/edit products, pack sizes and prices, categories; archive/restore
- [ ] ERP forms: create purchase orders, vendors
- [ ] Online payments (Razorpay) + webhook + unpaid-order expiry job
- [ ] Image upload (S3/R2 presigned URLs)
- [ ] Order notifications (SMS/WhatsApp) via BullMQ on Redis

**Phase 2: operations**

- Recipe-based raw-material deduction on production, low-stock reorder suggestions
- GST invoices (PDF), coupons, delivery slots and pincode serviceability
- Reports: sales by product/day, wastage, stock valuation
- Audit log for admin actions

**Phase 3: growth**

- Expo mobile app, multi-branch stock transfers, POS mode, loyalty

## Conventions

- **Changing the data model:** edit `schema.prisma` → `pnpm db:migrate` → update enums in
  `packages/types/src/enums.ts` if you touched one → commit the migration.
- **Adding an endpoint:** schema in `@sweets/types` → DTO via `createZodDto` → controller/service
  in the module → method in `@sweets/api-client`.
- **Never edit `StockBatch.quantity` without writing a `StockMovement`.**
- IDs are cuids. Human-facing references use `SW-YYMMDD-XXXXXX` (orders) and `PO-…` (purchase orders).
