import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "sqlite-vec"],
  outputFileTracingIncludes: {
    // sqlite-vec resolves its platform binary at runtime via import.meta.resolve.
    // Force-include all platform packages so the matching one is present in the
    // standalone build regardless of where it was built.
    "/healthz": ["./node_modules/sqlite-vec-*/**"],
    "/api/**/*": ["./node_modules/sqlite-vec-*/**"],
    "/": ["./node_modules/sqlite-vec-*/**"],
  },
};

export default nextConfig;
