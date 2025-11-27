import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["seqdia"],
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/seqdia" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
