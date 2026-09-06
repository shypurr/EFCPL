import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // COA certificate uploads are capped at 5 MB in src/actions/coa.ts
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
