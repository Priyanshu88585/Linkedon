/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@linkedon/types", "@linkedon/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "**.linkedin.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

module.exports = nextConfig;
