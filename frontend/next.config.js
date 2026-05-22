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

module.exports = nextConfig;