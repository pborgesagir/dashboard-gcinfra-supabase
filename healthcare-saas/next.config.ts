import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  // Removed experimental optimizations to avoid permission issues during build
  // Removed ignoreBuildErrors and ignoreDuringBuilds since we fixed the issues
};

export default nextConfig;
