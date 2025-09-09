import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // Removed output: 'standalone' as it's not needed for Vercel deployment
  // Removed experimental optimizations to avoid permission issues during build
  // Removed ignoreBuildErrors and ignoreDuringBuilds since we fixed the issues
};

export default nextConfig;
