/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@supabase/supabase-js'],

  async headers() {
    // Mobile API routes are token-authenticated; CORS allows the Expo web
    // preview and future web clients to call them from any origin.
    const mobileCors = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Authorization,Content-Type' },
    ];

    return [
      { source: '/api/mobile/:path*', headers: mobileCors },
      { source: '/api/friends/:path*', headers: mobileCors },
    ];
  },
};

module.exports = nextConfig;
