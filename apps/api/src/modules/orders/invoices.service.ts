import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { amountInWords, financialYear } from './invoice-utils';

type Tx = Prisma.TransactionClient;
const Decimal = Prisma.Decimal;

/** GST state codes, for "Place of supply" and the CGST/SGST vs IGST decision. */
const STATE_CODES: Record<string, string> = {
  'jammu and kashmir': '01',
  'himachal pradesh': '02',
  punjab: '03',
  chandigarh: '04',
  uttarakhand: '05',
  haryana: '06',
  delhi: '07',
  rajasthan: '08',
  'uttar pradesh': '09',
  bihar: '10',
  sikkim: '11',
  'arunachal pradesh': '12',
  nagaland: '13',
  manipur: '14',
  mizoram: '15',
  tripura: '16',
  meghalaya: '17',
  assam: '18',
  'west bengal': '19',
  jharkhand: '20',
  odisha: '21',
  chhattisgarh: '22',
  'madhya pradesh': '23',
  gujarat: '24',
  'dadra and nagar haveli and daman and diu': '26',
  maharashtra: '27',
  karnataka: '29',
  goa: '30',
  lakshadweep: '31',
  kerala: '32',
  'tamil nadu': '33',
  puducherry: '34',
  'andaman and nicobar islands': '35',
  telangana: '36',
  'andhra pradesh': '37',
  ladakh: '38',
};
const STATE_ALIASES: Record<string, string> = { mh: 'maharashtra', 'new delhi': 'delhi' };

const normState = (s: string) => {
  const k = s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/&/g, 'and');
  return STATE_ALIASES[k] ?? k;
};

const esc = (v: unknown) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const money = (d: Prisma.Decimal | number) =>
  `₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(d))}`;
const istDate = (d: Date) =>
  d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const invoiceInclude = {
  items: { include: { variant: { select: { product: { select: { hsnCode: true } } } } } },
  payments: { orderBy: { createdAt: 'desc' } },
  customer: { select: { name: true, phone: true, email: true } },
} satisfies Prisma.OrderInclude;
type InvoiceOrder = Prisma.OrderGetPayload<{ include: typeof invoiceInclude }>;

/**
 * GST tax invoices. An invoice is issued when an order is delivered (or collected): it gets
 * the next number in the financial-year sequence, inside the same transaction, so numbers
 * are gapless and never reused. Prices are tax-inclusive, so each line's taxable value is
 * backed out of the line total at its GST rate.
 */
@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Assigns an invoice number if the order doesn't have one yet. Idempotent. */
  async issue(tx: Tx, orderId: string, at = new Date()) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { invoiceNumber: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.invoiceNumber) return order.invoiceNumber;

    const fy = financialYear(at);
    // Row lock via upsert-increment: concurrent deliveries can't take the same number.
    const seq = await tx.invoiceSequence.upsert({
      where: { financialYear: fy },
      create: { financialYear: fy, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    const prefix = this.config.get('INVOICE_PREFIX', { infer: true });
    const invoiceNumber = `${prefix}/${fy}/${String(seq.lastNumber).padStart(5, '0')}`;
    await tx.order.update({ where: { id: orderId }, data: { invoiceNumber, invoicedAt: at } });
    return invoiceNumber;
  }

  /** Printable tax invoice (HTML; print or "Save as PDF" from the browser). */
  async html(idOrNumber: string, customerId?: string): Promise<string> {
    const where = { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] };
    let order = await this.prisma.order.findFirst({ where, include: invoiceInclude });
    if (!order || (customerId && order.customerId !== customerId)) {
      throw new NotFoundException('Order not found');
    }
    if (!order.invoiceNumber) {
      // Orders delivered before invoicing existed get their invoice on first request.
      if (order.status !== 'DELIVERED' && order.status !== 'REFUNDED') {
        throw new BadRequestException('The invoice is issued once the order is delivered.');
      }
      const delivered = await this.prisma.orderStatusEvent.findFirst({
        where: { orderId: order.id, status: 'DELIVERED' },
        orderBy: { createdAt: 'desc' },
      });
      await this.prisma.$transaction((tx) =>
        this.issue(tx, order!.id, delivered?.createdAt ?? new Date()),
      );
      order = await this.prisma.order.findFirstOrThrow({ where, include: invoiceInclude });
    }
    return this.render(order);
  }

  private render(order: InvoiceOrder): string {
    const c = <K extends keyof Env>(k: K) => this.config.get(k, { infer: true });
    const address = order.address as Record<string, string> | null;
    const sellerState = normState(c('SELLER_STATE'));
    const supplyState = address?.state ? normState(address.state) : sellerState;
    const intraState = supplyState === sellerState;
    const supplyCode = STATE_CODES[supplyState];
    const supplyLabel = `${address?.state ?? c('SELLER_STATE')}${supplyCode ? ` (${supplyCode})` : ''}`;

    let taxable = new Decimal(0);
    let tax = new Decimal(0);
    let cgstTotal = new Decimal(0);
    const rows = order.items.map((item, i) => {
      const rate = new Decimal(item.taxRatePercent);
      const lineTaxable = item.lineTotal.mul(100).div(rate.add(100)).toDecimalPlaces(2);
      const lineTax = item.lineTotal.sub(lineTaxable);
      const half = lineTax.div(2).toDecimalPlaces(2);
      cgstTotal = cgstTotal.add(half);
      taxable = taxable.add(lineTaxable);
      tax = tax.add(lineTax);
      const hsn = item.hsnCode ?? item.variant.product.hsnCode ?? '';
      const taxCells = intraState
        ? `<td class="r">${rate.div(2).toString()}%<br>${money(half)}</td><td class="r">${rate.div(2).toString()}%<br>${money(lineTax.sub(half))}</td>`
        : `<td class="r">${rate.toString()}%<br>${money(lineTax)}</td>`;
      return `<tr><td>${i + 1}</td><td>${esc(item.productName)}<div class="muted">${esc(item.variantLabel)} · ${esc(item.sku)}</div></td><td>${esc(hsn)}</td><td class="r">${item.quantity}</td><td class="r">${money(item.unitPrice)}</td><td class="r">${money(lineTaxable)}</td>${taxCells}<td class="r">${money(item.lineTotal)}</td></tr>`;
    });
    // Totals are the sum of the per-line amounts, so the invoice adds up to the paisa.
    const cgst = cgstTotal;
    const cols = intraState ? 10 : 9;
    const payment = order.payments[0];
    const paymentLabel =
      !payment || payment.provider === 'COD'
        ? order.fulfillment === 'PICKUP'
          ? 'Pay at store'
          : 'Cash on delivery'
        : payment.provider;

    const buyer =
      order.fulfillment === 'DELIVERY' && address
        ? `${esc(address.name)}<br>${esc([address.line1, address.line2].filter(Boolean).join(', '))}<br>${esc(address.city)}, ${esc(address.state)} ${esc(address.pincode)}<br>Phone: ${esc(address.phone)}`
        : `${esc(order.customer.name)}${order.customer.phone ? `<br>Phone: ${esc(order.customer.phone)}` : ''}<br><span class="muted">Collected from store</span>`;

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice ${esc(order.invoiceNumber)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font: 13px/1.45 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1f1612; margin: 0; background: #f4f1ec; }
  .sheet { max-width: 820px; margin: 24px auto; background: #fff; padding: 36px 40px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  h1 { font-size: 22px; margin: 0; } h2 { font-size: 15px; letter-spacing: .18em; text-transform: uppercase; margin: 0; color: #7d1b28; }
  .muted { color: #6f5f55; font-size: 11.5px; } .r { text-align: right; } .b { font-weight: 700; }
  .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #7d1b28; padding-bottom: 16px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 18px 0; }
  .label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .12em; color: #6f5f55; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; } th, td { padding: 7px 6px; border-bottom: 1px solid #e8dece; vertical-align: top; }
  th { font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; color: #6f5f55; text-align: left; background: #faf6ef; }
  .totals { margin-left: auto; width: 320px; margin-top: 14px; } .totals td { border: 0; padding: 4px 6px; }
  .grand td { border-top: 2px solid #1f1612; font-size: 15px; font-weight: 800; padding-top: 8px; }
  .words { margin-top: 12px; padding: 10px 12px; background: #faf6ef; border-radius: 6px; }
  .foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; gap: 24px; }
  .sign { text-align: right; } .sign .line { margin-top: 40px; border-top: 1px solid #1f1612; padding-top: 4px; }
  .actions { max-width: 820px; margin: 16px auto 0; text-align: right; }
  .actions button { font: inherit; background: #7d1b28; color: #fff; border: 0; border-radius: 999px; padding: 9px 20px; cursor: pointer; }
  @media print { body { background: #fff; } .sheet { box-shadow: none; margin: 0; padding: 0; max-width: none; } .actions { display: none; } }
</style></head>
<body>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="sheet">
  <div class="top">
    <div>
      <h1>${esc(c('SELLER_TRADE_NAME'))}</h1>
      <div>${esc(c('SELLER_LEGAL_NAME'))}</div>
      <div class="muted">${esc(c('SELLER_ADDRESS'))}</div>
      <div class="muted">${esc(c('SELLER_PHONE'))} · ${esc(c('SELLER_EMAIL'))}</div>
      <div class="muted">GSTIN <span class="b">${esc(c('SELLER_GSTIN'))}</span> · FSSAI ${esc(c('SELLER_FSSAI'))}</div>
    </div>
    <div class="r">
      <h2>Tax invoice</h2>
      <div class="muted" style="margin-top:6px">Original for recipient</div>
    </div>
  </div>
  <div class="grid">
    <div>
      <div class="label">Bill to</div>
      <div>${buyer}</div>
    </div>
    <div>
      <table>
        <tr><td class="muted">Invoice no.</td><td class="b r">${esc(order.invoiceNumber)}</td></tr>
        <tr><td class="muted">Invoice date</td><td class="r">${istDate(order.invoicedAt ?? new Date())}</td></tr>
        <tr><td class="muted">Order no.</td><td class="r">${esc(order.orderNumber)}</td></tr>
        <tr><td class="muted">Order date</td><td class="r">${istDate(order.createdAt)}</td></tr>
        <tr><td class="muted">Place of supply</td><td class="r">${esc(supplyLabel)}</td></tr>
        <tr><td class="muted">Payment</td><td class="r">${esc(paymentLabel)}</td></tr>
      </table>
    </div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Item</th><th>HSN</th><th class="r">Qty</th><th class="r">Rate (incl. GST)</th><th class="r">Taxable value</th>${intraState ? '<th class="r">CGST</th><th class="r">SGST</th>' : '<th class="r">IGST</th>'}<th class="r">Amount</th></tr></thead>
    <tbody>
      ${rows.join('\n      ')}
      ${Number(order.deliveryFee) > 0 ? `<tr><td></td><td colspan="${cols - 2}">Delivery charges</td><td class="r">${money(order.deliveryFee)}</td></tr>` : ''}
    </tbody>
  </table>
  <table class="totals">
    <tr><td class="muted">Taxable value</td><td class="r">${money(taxable)}</td></tr>
    ${intraState ? `<tr><td class="muted">CGST</td><td class="r">${money(cgst)}</td></tr><tr><td class="muted">SGST</td><td class="r">${money(tax.sub(cgst))}</td></tr>` : `<tr><td class="muted">IGST</td><td class="r">${money(tax)}</td></tr>`}
    ${Number(order.deliveryFee) > 0 ? `<tr><td class="muted">Delivery charges</td><td class="r">${money(order.deliveryFee)}</td></tr>` : ''}
    ${Number(order.discountTotal) > 0 ? `<tr><td class="muted">Discount</td><td class="r">− ${money(order.discountTotal)}</td></tr>` : ''}
    <tr class="grand"><td>Total</td><td class="r">${money(order.total)}</td></tr>
  </table>
  <div class="words"><span class="label">Amount in words</span><br>${amountInWords(Number(order.total))}</div>
  <div class="foot">
    <div class="muted">Prices are inclusive of GST. Tax is not payable on reverse charge.<br>This is a computer-generated invoice.</div>
    <div class="sign"><div>For ${esc(c('SELLER_LEGAL_NAME'))}</div><div class="line muted">Authorised signatory</div></div>
  </div>
</div>
</body></html>`;
  }
}
