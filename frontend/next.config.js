/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the hostnames and IPs we are using to access the dev server
  // Note: values are compared against window.location.hostname (without port)
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '[::1]',
    '132.145.205.0'
  ],
  experimental: {},
};

module.exports = nextConfig;// force redeploy Thu Jul 16 15:55:38 UTC 2026
// force clean build Thu Jul 16 16:03:57 UTC 2026
