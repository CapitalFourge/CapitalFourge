/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the IP address we are using to access the dev server
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://[::1]:3000',
    'http://132.145.205.0:3000'
  ],
};

module.exports = nextConfig;
