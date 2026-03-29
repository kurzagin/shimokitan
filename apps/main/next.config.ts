
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
};

export default nextConfig;
