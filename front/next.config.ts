import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "vclm.rck.dscloud.biz",
        pathname: "/uploads/**",
      },
    ],
  },
  // 빌드 시 lint 무시
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
