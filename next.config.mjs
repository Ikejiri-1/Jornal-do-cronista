/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

export default {
  poweredByHeader: false,
  serverExternalPackages: ['argon2'],
  // O módulo nativo precisa do binário do Linux (Vercel) mesmo quando o build roda em outro sistema.
  outputFileTracingIncludes: { '/api/auth/*': ['./node_modules/argon2/prebuilds/linux-x64/**'] },
  // O app atual do jornal (HTML + JS) roda como página estática dentro do Next enquanto as telas migram para React.
  async rewrites() {
    return { beforeFiles: [{ source: '/', destination: '/legacy/index.html' }] };
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
