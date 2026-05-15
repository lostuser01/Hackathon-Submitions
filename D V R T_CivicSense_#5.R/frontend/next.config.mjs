/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},

  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: ["file-loader"],
    });

    return config;
  },
};

export default nextConfig;
