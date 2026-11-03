import type { NextConfig } from 'next';


const NODE_ONLY_PACKAGES = [
  'pg',
  'pg-native',
  'pg-pool',
  'pg-protocol',
  'pg-types',
  'pgpass',
  'pg-connection-string',
  'pg-cloudflare',
  'pg-int8',
  'postgres-array',
  'postgres-bytea',
  'postgres-date',
  'postgres-interval',
  'split2',
  '@prisma/client',
  'prisma',
];

const NODE_BUILTINS = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'events',
  'fs',
  'http',
  'https',
  'inspector',
  'net',
  'os',
  'path',
  'perf_hooks',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'tls',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
];

const nextConfig: NextConfig = {
  serverExternalPackages: NODE_ONLY_PACKAGES,

  webpack: (config, context) => {
    if (context.isServer) {
      if (!Array.isArray(config.externals)) {
        config.externals = config.externals ? [config.externals] : [];
      }

      config.externals.push(
        (
          { request }: { request?: string },
          callback: (err?: null | Error, result?: string) => void,
        ) => {
          if (!request) return callback();

          if (request.startsWith('node:')) {
            return callback(null, `commonjs ${request}`);
          }

          if (NODE_BUILTINS.includes(request)) {
            return callback(null, `commonjs ${request}`);
          }

          if (
            NODE_ONLY_PACKAGES.some(
              (pkg) => request === pkg || request.startsWith(`${pkg}/`),
            )
          ) {
            return callback(null, `commonjs ${request}`);
          }

          callback();
        },
      );
    }

    return config;
  },
};

export default nextConfig;