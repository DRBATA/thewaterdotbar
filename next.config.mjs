/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      // Ensure font files for the /api/order/receipt route are included
      // This helps Vercel bundle the necessary .afm files for PDFKit.
      '/api/order/receipt': ['./node_modules/pdfkit/js/data/**/*'],
    },
  },
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