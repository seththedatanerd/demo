/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If deploying to username.github.io/repo-name, set basePath
  // basePath: '/demo',
  trailingSlash: true,
}

module.exports = nextConfig
