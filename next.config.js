/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'drive.google.com', 'docs.google.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'docs.google.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Configuration pour les téléchargements
  async headers() {
    return [
      {
        source: '/api/download',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },

  // ✅ Correction pour Next.js 15
  serverExternalPackages: ['googleapis', 'google-auth-library'],

  experimental: {
    // ✅ Supprimer serverComponentsExternalPackages (déplacé vers serverExternalPackages)
    workerThreads: false,
    cpus: 1,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfills pour le côté client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        fs: false,
        child_process: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
      }
    }

    // ✅ Ignorer les warnings
    config.ignoreWarnings = [
      /Critical dependency:/,
      { module: /node_modules/ },
    ]

    return config
  },

  // ✅ Désactiver la vérification TypeScript pour le build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig