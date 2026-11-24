import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pathfinder/core"],
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/:p(.*%5[cC].*)", destination: "/__nf-encoded-backslash" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
