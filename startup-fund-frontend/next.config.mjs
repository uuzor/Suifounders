/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@mysten/dapp-kit-react', 
      '@mysten/dapp-kit-core',
      '@lit/context',
      '@lit/react',
      '@webcomponents/scoped-custom-element-registry',
      'lit',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
