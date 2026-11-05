import { ImageResponse } from 'next/og';
import { artDataUri, MONOGRAM_DATA_URI } from '@/lib/brand-art';
import { site } from '@/lib/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${site.name}: fresh Indian sweets`;

/** Default preview when the shop is shared on WhatsApp, Instagram or Facebook. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#2d0a10',
        color: '#faf6ef',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 70px',
          width: 640,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MONOGRAM_DATA_URI} width={84} height={84} alt="" />
        <div style={{ fontSize: 76, marginTop: 30, lineHeight: 1.05 }}>{site.name}</div>
        <div style={{ fontSize: 34, marginTop: 18, color: '#e8c987' }}>{site.tagline}</div>
        <div
          style={{ fontSize: 26, marginTop: 30, color: '#d3c1a6' }}
        >{`Delivered in ${site.delivery.eta} · ${site.delivery.area}`}</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artDataUri('kaju-katli')}
        width={560}
        height={630}
        style={{ objectFit: 'cover' }}
        alt=""
      />
    </div>,
    size,
  );
}
