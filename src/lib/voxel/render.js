/**
 * Draws a voxel scene as an isometric SVG.
 *
 * Built at build time and emitted as markup, for the same reason the Mermaid
 * diagrams are: a wiki page should not need JavaScript to show what it is
 * explaining, and a picture generated from text stays correct when the text is
 * edited. A screenshot does not.
 *
 * The projection is the usual 2:1 isometric. Blocks are painted back to front
 * rather than depth tested, which is exact here because every block sits on the
 * same lattice: sorting by x + y + z never leaves two blocks in the wrong order.
 */

const TILE_W = 32;   // half-width of a block's diamond top
const TILE_H = 16;   // half-height of that diamond
const TILE_Z = 26;   // how tall a block stands

const shade = (hex, factor) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value.slice(0, 6);
  const parts = [0, 2, 4].map((i) => {
    const channel = Math.round(parseInt(full.slice(i, i + 2), 16) * factor);
    return Math.max(0, Math.min(255, channel));
  });
  return `#${parts.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

const project = (x, y, z) => ({
  x: (x - z) * TILE_W,
  y: (x + z) * TILE_H - y * TILE_Z,
});

const polygon = (points, fill, opacity) =>
  `<polygon points="${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}"`
  + ` fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}/>`;

/**
 * A face is skipped when a solid block sits against it. Without this the inside
 * of a sealed room is a solid lump and the hole this whole diagram exists to
 * show is invisible from every angle.
 */
const occupied = (index, x, y, z) => {
  const found = index.get(`${x},${y},${z}`);
  return Boolean(found) && !found.ghost;
};

export function renderVoxel(scene) {
  const { blocks } = scene;
  if (!blocks.length) return '';

  const index = new Map(blocks.map((b) => [`${b.x},${b.y},${b.z}`, b]));
  const ordered = [...blocks].sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));

  const faces = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const track = (p) => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  };

  for (const block of ordered) {
    const { x, y, z, color, ghost } = block;
    const opacity = ghost ? 0.28 : 1;
    const o = project(x, y, z);
    // corners of this block's top face, clockwise from the far corner
    const top = [
      { x: o.x, y: o.y - TILE_Z },
      { x: o.x + TILE_W, y: o.y - TILE_Z + TILE_H },
      { x: o.x, y: o.y - TILE_Z + TILE_H * 2 },
      { x: o.x - TILE_W, y: o.y - TILE_Z + TILE_H },
    ];
    const drop = (p) => ({ x: p.x, y: p.y + TILE_Z });

    if (!occupied(index, x, y + 1, z)) {
      faces.push(polygon(top, shade(color, 1.18), opacity));
      top.forEach(track);
    }
    // the face towards the viewer on the +z side
    if (!occupied(index, x, y, z + 1)) {
      const quad = [top[2], top[3], drop(top[3]), drop(top[2])];
      faces.push(polygon(quad, shade(color, 0.72), opacity));
      quad.forEach(track);
    }
    // and on the +x side
    if (!occupied(index, x + 1, y, z)) {
      const quad = [top[1], top[2], drop(top[2]), drop(top[1])];
      faces.push(polygon(quad, shade(color, 0.92), opacity));
      quad.forEach(track);
    }
  }

  const pad = 14;
  const width = maxX - minX + pad * 2;
  const height = maxY - minY + pad * 2;
  const body = `<g transform="translate(${(pad - minX).toFixed(1)} ${(pad - minY).toFixed(1)})">`
    + faces.join('') + '</g>';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(0)} ${height.toFixed(0)}"`
    + ` width="${width.toFixed(0)}" height="${height.toFixed(0)}" role="img"`
    + ` aria-label="${escapeAttr(scene.title || 'voxel diagram')}">${body}</svg>`;
}

const escapeAttr = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderFigure(scene) {
  const svg = renderVoxel(scene);
  if (!svg) return '';
  const legend = scene.legend.length
    ? '<ul class="voxel-legend">' + scene.legend.map((entry) =>
        `<li><span class="voxel-swatch" style="background:${entry.color}"></span>${escapeAttr(entry.label)}</li>`
      ).join('') + '</ul>'
    : '';
  const caption = scene.caption
    ? `<figcaption>${escapeAttr(scene.caption)}</figcaption>`
    : '';
  const title = scene.title ? `<p class="voxel-title">${escapeAttr(scene.title)}</p>` : '';
  return `<figure class="voxel-figure">${title}<div class="voxel-stage">${svg}</div>${legend}${caption}</figure>`;
}
