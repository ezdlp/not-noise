
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Only run middleware on the path we need
  experimental: {
    middleware: {
      skipMiddlewareUrlNormalize: true,
      // Only run middleware on the smart link paths
      matcher: ['/link/:path*'],
    }
  },
  
  // Configure images to be served from our domain
  images: {
    domains: ['soundraiser.io', 'i.scdn.co'],
    formats: ['image/webp'],
  }
};

module.exports = nextConfig;
