import { ImageResponse } from 'next/og';
import { MONOGRAM_DATA_URI } from '@/lib/brand-art';

const SIZES = new Set([192, 512]);

/** PNG icons for the web app manifest (Android "Add to home screen"). */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size.replace(/\.png$/, ''));
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 });
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#7d1b28',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MONOGRAM_DATA_URI} width={size * 0.8} height={size * 0.8} alt="" />
    </div>,
    { width: size, height: size },
  );
}
