import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import remarkVoxel from './src/lib/voxel/remark-voxel.mjs';
import remarkLinkPreview from './src/lib/preview/remark-link-preview.mjs';
import remarkRounds from './src/lib/chart/remark-rounds.mjs';
import { mermaidConfig } from './src/lib/mermaid/config.mjs';
import sidebar from './src/sidebar.json' with { type: 'json' };

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
      // Dark only; Starlight's light theme only half-applied over this palette.
      components: {
        ThemeProvider: './src/components/DarkThemeProvider.astro',
        ThemeSelect: './src/components/NoThemeSelect.astro',
      },
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
      // Also read by MoveEarth's in-game wiki, for the same order and groups.
      sidebar,
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
          mermaidConfig,
        },
      ],
    ],
  },
  site: 'https://rusklabo.github.io/moveearth-web',
  base: '/moveearth-web',
});
