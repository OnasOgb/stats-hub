/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/leaderboard",
        destination: "/",
        permanent: true,
      },
      {
        source: "/player/:id",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
