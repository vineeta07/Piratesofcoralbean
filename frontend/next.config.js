/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Emit /app/deals/index.html etc. so FastAPI's StaticFiles(html=True) serves every route.
  trailingSlash: true,
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // pptxgenjs/jspdf reference Node built-ins (node:fs, node:https) behind
      // runtime checks; strip the scheme and stub them out for the browser.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }),
      );
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, https: false, http: false, path: false, zlib: false };
    }
    return config;
  },
}

module.exports = nextConfig
