/**
 * Renders every Mermaid diagram in the docs to a PNG for MoveEarth's in-game wiki.
 *
 * Minecraft cannot draw SVG, and Mermaid lays its labels out in a browser, so the
 * game cannot draw these itself the way it draws the voxel and rounds diagrams.
 * This writes public/ingame/mermaid/<key>.png at twice the CSS size, so the image
 * stays sharp at large GUI scales, and index.json with each diagram's CSS size.
 * The site publishes them with everything else; the game's build fetches them
 * by key (see src/lib/mermaid/blocks.mjs) and bundles them.
 *
 * Run before `astro build`, in CI: npm run ingame
 */
import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createMermaidRenderer } from 'mermaid-isomorphic';
import { chromium } from 'playwright';
import { mermaidConfig } from '../src/lib/mermaid/config.mjs';
import { mermaidBlocks } from '../src/lib/mermaid/blocks.mjs';

const DOCS = 'src/content/docs';
const OUT = 'public/ingame/mermaid';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap';

async function markdownFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(full));
    else if (/\.mdx?$/.test(entry.name)) files.push(full);
  }
  return files.sort();
}

const diagrams = new Map();
for (const file of await markdownFiles(DOCS)) {
  for (const block of mermaidBlocks(await readFile(file, 'utf8'))) diagrams.set(block.key, block.source);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const keys = [...diagrams.keys()];
const index = {};
if (keys.length) {
  const render = createMermaidRenderer();
  const results = await render(keys.map((key) => diagrams.get(key)), { mermaidConfig, css: FONT_CSS });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1200, height: 900 } });
    for (let i = 0; i < keys.length; i++) {
      const result = results[i];
      if (result.status !== 'fulfilled') {
        throw new Error(`Mermaid diagram ${keys[i]} failed to render: ${result.reason}`);
      }
      await page.setContent('<!doctype html><html><head><meta charset="utf-8">'
        + `<link rel="stylesheet" href="${FONT_CSS}">`
        + '<style>html,body{margin:0;background:transparent}</style></head>'
        + `<body>${result.value.svg}</body></html>`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const svg = page.locator('svg').first();
      const box = await svg.boundingBox();
      await svg.screenshot({ path: path.join(OUT, `${keys[i]}.png`), omitBackground: true });
      index[keys[i]] = { width: Math.round(box.width), height: Math.round(box.height) };
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(OUT, 'index.json'), JSON.stringify({ diagrams: index }, null, 2) + '\n');
console.log(`Rendered ${keys.length} Mermaid diagram(s) to ${OUT}`);
