import { shotsFor } from './parse.js';

/**
 * Draws each material as a bar of its health, divided where each shot lands.
 *
 * The point is the last division. A bar that ends just past a boundary shows
 * why the count is what it is, and shows that a block with barely any health
 * left still costs a whole round -- which a column of numbers does not.
 */
const ROW_H = 34;
const BAR_H = 20;
const LABEL_W = 108;
const COUNT_W = 54;
const SCALE = 0.62;   // pixels per point of health

const escape = (text) => String(text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderRounds(chart) {
  const { rows, damage } = chart;
  if (!rows.length || !(damage > 0)) return '';

  const widest = Math.max(...rows.map((r) => r.health));
  const barMax = widest * SCALE;
  const width = LABEL_W + barMax + COUNT_W + 16;
  const height = rows.length * ROW_H + 8;
  const parts = [];

  rows.forEach((row, index) => {
    const y = index * ROW_H + 4;
    const { shots, remainder } = shotsFor(row.health, damage);
    parts.push(
      `<text x="0" y="${y + BAR_H - 5}" class="rounds-label">${escape(row.label)}</text>`,
      `<text x="${LABEL_W - 8}" y="${y + BAR_H - 5}" class="rounds-hp">${row.health}</text>`,
    );
    // one segment per shot; the last is only as wide as what is left to remove
    for (let shot = 0; shot < shots; shot++) {
      const spent = shot === shots - 1 ? remainder : damage;
      const x = LABEL_W + shot * damage * SCALE;
      parts.push(
        `<rect x="${x.toFixed(1)}" y="${y}" width="${(spent * SCALE).toFixed(1)}"`
        + ` height="${BAR_H}" rx="2" class="rounds-seg${shot === shots - 1 && remainder < damage ? ' is-partial' : ''}"/>`,
      );
    }
    parts.push(
      `<text x="${(LABEL_W + barMax + 10).toFixed(1)}" y="${y + BAR_H - 5}" class="rounds-count">${shots}発</text>`,
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(0)} ${height}"`
    + ` width="${width.toFixed(0)}" height="${height}" role="img"`
    + ` aria-label="${escape(chart.title || '必要発数')}">${parts.join('')}</svg>`;
}

export function renderFigure(chart) {
  const svg = renderRounds(chart);
  if (!svg) return '';
  const title = chart.title ? `<p class="rounds-title">${escape(chart.title)}</p>` : '';
  const caption = chart.caption ? `<figcaption>${escape(chart.caption)}</figcaption>` : '';
  const key = `<p class="rounds-key">1区切り = 1発（${chart.damage}ダメージ）。`
    + `<span class="rounds-swatch is-partial"></span> は最後の1発で、使い切らなくても1発分掛かります。</p>`;
  return `<figure class="rounds-figure">${title}<div class="rounds-stage">${svg}</div>${key}${caption}</figure>`;
}
