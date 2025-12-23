import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "randomuser.me",
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "img.clerk.com",
    ],
  },
};

export default nextConfig;
