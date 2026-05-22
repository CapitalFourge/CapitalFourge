/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the IP address we are using to access the dev server
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '[::1]:3000',
    '132.145.205.0:3000'
  ],
  experimental: {
    serverActions: {},
  },
};

module.exports = nextConfig;
