import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Restrict to the real image CDN / S3 bucket host once it exists.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async redirects() {
    return [{ source: '/products', destination: '/shop', permanent: true }];
  },
};

export default nextConfig;
