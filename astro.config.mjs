import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import remarkVoxel from './src/lib/voxel/remark-voxel.mjs';
import remarkLinkPreview from './src/lib/preview/remark-link-preview.mjs';

export default defineConfig({
  integrations: [
    // Starlight brings its own base styles, so Tailwind's preflight is turned
    // off: with it on, the two reset the same elements and the docs pages lose
    // their headings and lists. The marketing pages keep every utility class
    // they already use.
    tailwind({ applyBaseStyles: false }),
    starlight({
      title: 'MoveEarth Wiki',
      defaultLocale: 'root',
      locales: { root: { label: '日本語', lang: 'ja' } },
      customCss: ['./src/styles/starlight.css'],
      social: [{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/QNquTTTdZh' }],
      pagination: true,
      sidebar: [
        { label: 'はじめに', items: [{ slug: 'guide/start' }] },
        {
          label: '拠点を作る',
          items: [{ slug: 'guide/base' }],
        },
        {
          label: '戦争をする',
          items: [{ slug: 'guide/siege' }],
        },
        {
          label: 'リファレンス',
          autogenerate: { directory: 'reference' },
        },
        // Starlight's own header only offers the site title as a way out, so
        // the rest of the site is linked from here until the remaining pages
        // have been moved across.
        {
          label: 'サイト内の他のページ',
          items: [
            // Written without the base path: Starlight prepends it, and
            // including it here lands the reader on /moveearth-web/moveearth-web/.
            { label: '個別システム（旧Wiki）', link: '/wiki/' },
            { label: '参加方法', link: '/join/' },
          ],
        },
      ],
    }),
  ],
  markdown: {
    remarkPlugins: [
      remarkVoxel,
      [remarkLinkPreview, { root: './src/content/docs' }],
    ],
    // Rendered to SVG during the build, so a diagram needs no client script and
    // still shows with JavaScript off. The cost is a headless browser in CI.
    //
    // Not the plugin's `dark` option: that emits both variants and switches on
    // prefers-color-scheme, which leaves a white diagram on this always-dark
    // site for anyone whose system is set to light. The theme is pinned instead.
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: 'inline-svg',
          mermaidConfig: {
            theme: 'base',
            themeVariables: {
              darkMode: true,
              background: '#16211a',
              primaryColor: '#203126',
              primaryTextColor: '#eef5e7',
              primaryBorderColor: '#75a84b',
              secondaryColor: '#1b2a20',
              tertiaryColor: '#16211a',
              lineColor: '#8b9784',
              textColor: '#eef5e7',
              mainBkg: '#203126',
              nodeBorder: '#75a84b',
              clusterBkg: '#16211a',
              clusterBorder: '#4e5a48',
              edgeLabelBackground: '#101713',
              fontFamily: "'Zen Kaku Gothic New', sans-serif",
            },
          },
        },
      ],
    ],
  },
  site: 'https://rusklabo.github.io/moveearth-web',
  base: '/moveearth-web',
});
