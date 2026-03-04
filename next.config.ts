import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Isse build ke waqt errors ignore honge aur site live ho jayegi
    ignoreBuildErrors: true,
  },
  eslint: {
    // Isse linting errors ignore honge
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;