import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["archiver", "firebase-admin", "sharp"],
  outputFileTracingRoot: path.join(__dirname),
  // Deployable ZIP buyer deploys: keep root client-manifest.json in the serverless bundle
  // (Vercel) even if code also inlines it via import at build time.
  outputFileTracingIncludes: {
    "/*": ["./client-manifest.json"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
