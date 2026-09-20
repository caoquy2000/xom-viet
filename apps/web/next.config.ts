import type { NextConfig } from "next";
const config: NextConfig = {
  output: process.env.WEB_OUTPUT === "server" ? undefined : "export",
  images: { unoptimized: true },
  transpilePackages: ["@xom/api-client"],
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
};
export default config;
