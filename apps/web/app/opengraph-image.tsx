import { ImageResponse } from 'next/og';
import { logoDataUri } from '@/lib/brand-art';
import { site } from '@/lib/site';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${site.name}: fresh Indian sweets and snacks`;

/** Default preview when the shop is shared on WhatsApp, Instagram or Facebook. */
export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        background: '#3d020b',
        color: '#faf6ef',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 0 0 70px',
          width: 640,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: '#d9ae5b' }}>
          {site.descriptor.toUpperCase()}
        </div>
        <div style={{ fontSize: 80, marginTop: 20, lineHeight: 1.05 }}>{site.name}</div>
        <div style={{ fontSize: 34, marginTop: 18, color: '#e8c987' }}>{site.tagline}</div>
        <div
          style={{ fontSize: 26, marginTop: 30, color: '#d3c1a6' }}
        >{`Delivered across ${site.delivery.area}`}</div>
      </div>
      <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={await logoDataUri()} width={470} height={500} alt="" />
      </div>
    </div>,
    size,
  );
}
