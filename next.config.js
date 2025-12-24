/** @type {import('next').NextConfig} */
const nextConfig = {
    // Use standalone for serverless deployment
    // Remove 'export' for development with API routes
    images: {
        unoptimized: true,
    },
    // Ensure compatibility
    reactStrictMode: true,
};

module.exports = nextConfig;
