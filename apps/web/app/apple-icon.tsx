import { ImageResponse } from 'next/og';
import { MONOGRAM_DATA_URI } from '@/lib/brand-art';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon for iPhones. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#faf6ef',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MONOGRAM_DATA_URI} width={150} height={150} alt="" />
    </div>,
    size,
  );
}
