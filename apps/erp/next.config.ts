import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Internal tool: keep it out of search engines.
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};

export default nextConfig;
