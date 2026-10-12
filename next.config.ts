import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {"/api/admin/finances/**/*": ["./lib/fonts/montserrat.ttf.base64", "./lib/fonts/montserrat-bold.ttf.base64"]},
};

export default nextConfig;
