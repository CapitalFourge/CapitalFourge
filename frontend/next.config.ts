import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://portfolio-manager:8080/api/:path*',
      },
    ];
  },
};

export default nextConfig;