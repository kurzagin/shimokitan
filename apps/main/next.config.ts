
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@shimokitan/db", "@shimokitan/ui", "@shimokitan/auth"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shimokitan.live',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/artifacts/:path*',
        destination: '/cinema/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
