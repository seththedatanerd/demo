/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/demo',
  assetPrefix: '/demo/',
  trailingSlash: true,
}

module.exports = nextConfig
