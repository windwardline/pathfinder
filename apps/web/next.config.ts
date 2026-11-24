import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pathfinder/core"],
  async rewrites() {
    return {
      // A real route followed by an encoded backslash (`/signin%5C`) reaches the
      // route's function on Vercel, whose launcher then looks for a page file
      // named after the raw path and throws MODULE_NOT_FOUND: a 500 where an
      // unknown path gets a 404. No route here contains a backslash, so send
      // every such path to a path with no route and let Next answer 404.
      // vercel.json rewrites cannot do this: they run after Next has matched
      // the route. beforeFiles runs first. A redirect that drops the backslash
      // is not an alternative: `/\evil.com` would become `//evil.com`.
      beforeFiles: [{ source: "/:path(.*%5[cC].*)", destination: "/__not-found" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
