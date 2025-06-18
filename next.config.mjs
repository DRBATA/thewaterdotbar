/** @type {import('next').NextConfig} */
const nextConfig = {

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Added this from your pasted version
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;