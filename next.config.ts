import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-46fde1bb-6e0a-4052-b1b0-9a5238d57a99.space-z.ai",
    "*.space-z.ai",
  ],
};

export default nextConfig;
