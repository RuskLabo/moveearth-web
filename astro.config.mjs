import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import remarkVoxel from './src/lib/voxel/remark-voxel.mjs';
import remarkLinkPreview from './src/lib/preview/remark-link-preview.mjs';
import remarkRounds from './src/lib/chart/remark-rounds.mjs';

export default defineConfig({
  integrations: [
    // Starlight brings its own base styles, so Tailwind's preflight is turned
    // off: with it on, the two reset the same elements and the docs pages lose
    // their headings and lists. The marketing pages keep every utility class
    // they already use.
    tailwind({ applyBaseStyles: false }),
    starlight({
      title: 'MoveEarth ガイド',
      defaultLocale: 'root',
      locales: { root: { label: '日本語', lang: 'ja' } },
      customCss: ['./src/styles/starlight.css'],
      head: [{
        tag: 'script',
        content: `document.addEventListener('click', function (event) {
          var button = event.target.closest('.voxel-cutaway-toggle');
          if (!button) return;
          var figure = button.closest('.voxel-figure');
          var hidden = figure.classList.toggle('voxel-cutaway-hidden');
          button.setAttribute('aria-pressed', String(hidden));
          button.textContent = hidden ? '手前の壁を表示' : '手前の壁を隠す';
        });`,
      }],
      social: [{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/QNquTTTdZh' }],
      pagination: true,
      sidebar: [
        { label: '基本', items: [
          { slug: 'guide/about' }, { slug: 'guide/start' },
          { slug: 'guide/starter-kit' }, { slug: 'guide/survival' }, { slug: 'guide/rules' },
          { slug: 'guide/faq' },
        ] },
        { label: '参加', items: [{ label: '参加方法', link: '/join/' }] },
        { label: '生産・交易', items: [
          { slug: 'guide/resources' }, { slug: 'guide/nether' },
          { slug: 'guide/industry' }, { slug: 'guide/jobs' }, { slug: 'guide/market' },
          { slug: 'guide/balance' }, { slug: 'guide/gun-disassembly' },
        ] },
        {
          label: '拠点を作る',
          items: [{ slug: 'guide/base' }, { slug: 'guide/fortress' }, { slug: 'guide/player-detector' }],
        },
        {
          label: '戦争をする',
          items: [{ slug: 'guide/siege' }, { slug: 'guide/attack' }, { slug: 'guide/siegecraft' },
            { slug: 'guide/combat' }, { slug: 'guide/prisoners' }, { slug: 'guide/loot' },
            { slug: 'guide/recovery' }],
        },
        { label: '探索・交流', items: [
          { slug: 'guide/warehouse' }, { slug: 'guide/airship-raid' },
          { slug: 'guide/events' }, { slug: 'guide/communication' },
          { slug: 'guide/notifications' }, { slug: 'guide/streaming' },
        ] },
        {
          label: 'リファレンス',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
  markdown: {
    remarkPlugins: [
      remarkVoxel,
      remarkRounds,
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
