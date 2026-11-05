import { ImageResponse } from 'next/og';
import { artDataUri } from '@/lib/brand-art';
import { CATALOG_REVALIDATE, serverApi } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { site } from '@/lib/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Product photo';

/** Product preview for WhatsApp / social shares: picture, name and starting price. */
export default async function ProductOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await serverApi.catalog.product(slug, CATALOG_REVALIDATE).catch(() => null);
  const name = product?.name ?? site.name;
  const from = product?.basePrice ? `From ${formatMoney(product.basePrice)}` : '';
  const picture = product?.images[0] ?? artDataUri(`${slug}-${name}`);
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#faf6ef' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={picture} width={630} height={630} style={{ objectFit: 'cover' }} alt="" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 56px',
          width: 570,
        }}
      >
        <div
          style={{ fontSize: 26, letterSpacing: 6, color: '#9e7428', textTransform: 'uppercase' }}
        >
          {site.name}
        </div>
        <div style={{ fontSize: 68, lineHeight: 1.05, marginTop: 16, color: '#1f1612' }}>
          {name}
        </div>
        {from && (
          <div style={{ fontSize: 40, marginTop: 24, color: '#7d1b28', fontWeight: 700 }}>
            {from}
          </div>
        )}
        <div
          style={{ fontSize: 24, marginTop: 28, color: '#6f5f55' }}
        >{`Made fresh today · Delivered in ${site.delivery.eta}`}</div>
      </div>
    </div>,
    size,
  );
}
