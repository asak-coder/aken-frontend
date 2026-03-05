/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async redirects() {
    return [
      // Canonical host enforcement: www -> non-www
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.aken.firm.in" }],
        destination: "https://aken.firm.in/:path*",
        permanent: true,
      },
      // Defensive: if a bad rule ever sends users to /X, redirect back to home.
      {
        source: "/X",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
