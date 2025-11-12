/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['polymarket.com'],
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
