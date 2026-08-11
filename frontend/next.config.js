/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Allow the hostnames and IPs we are using to access the dev server
  // Note: values are compared against window.location.hostname (without port)
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '[::1]',
    '132.145.205.0'
  ],
  reactCompiler: false,
  // Disable automatic static optimization for certain paths if needed
  // This helps with the 503 on prefetch
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
// force redeploy Thu Jul 16 15:55:38 UTC 2026
// force clean build Thu Jul 16 16:03:57 UTC 2026
// force rebuild with auth redirect fix Aug 11 2026
