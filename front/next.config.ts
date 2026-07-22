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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
