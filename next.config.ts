import type { NextConfig } from "next";
const config: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  devIndicators: false,
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
};
export default config;
