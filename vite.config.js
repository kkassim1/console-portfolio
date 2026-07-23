import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const projectRoutes = [
  '/',
  '/project/kwam-developer-platform/',
  '/project/simon-says-assassin/',
  '/project/debate-app/',
  '/project/mshu/',
];

export default defineConfig(({ command }) => {
  const providerUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.URL || '';
  const siteUrl = (process.env.VITE_SITE_URL || providerUrl).replace(/\/$/, '');

  if (command === 'build' && !siteUrl) {
    console.warn('[portfolio] VITE_SITE_URL is not set; canonical and social URLs will be relative in this build.');
  }

  return {
    base: './',
    server: { host: true, open: true },
    plugins: [
      {
        name: 'deployment-assets',
        transformIndexHtml(html) {
          return html.replaceAll('__SITE_URL__', siteUrl);
        },
        generateBundle() {
          const robots = ['User-agent: *', 'Allow: /'];
          if (siteUrl) robots.push(`Sitemap: ${siteUrl}/sitemap.xml`);
          this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` });

          if (siteUrl) {
            const urls = projectRoutes.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join('\n');
            this.emitFile({
              type: 'asset',
              fileName: 'sitemap.xml',
              source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
            });
          }
        },
      },
    ],
    build: {
      rollupOptions: {
        input: {
          home: resolve(import.meta.dirname, 'index.html'),
          platform: resolve(import.meta.dirname, 'project/kwam-developer-platform/index.html'),
          simon: resolve(import.meta.dirname, 'project/simon-says-assassin/index.html'),
          debate: resolve(import.meta.dirname, 'project/debate-app/index.html'),
          mshu: resolve(import.meta.dirname, 'project/mshu/index.html'),
        },
      },
    },
  };
});
