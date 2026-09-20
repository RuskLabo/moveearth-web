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
  // Cutaway faces go in their own list so the reader can be given a switch for
  // them. They still have to be drawn in depth order with everything else, so
  // each one remembers where it belonged.
  const cutawayFaces = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const track = (p) => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  };

  for (const block of ordered) {
    const { x, y, z, color, ghost, cutaway } = block;
    const opacity = ghost ? 0.28 : 1;
    const into = cutaway ? cutawayFaces : faces;
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
      into.push(polygon(top, shade(color, 1.18), opacity));
      top.forEach(track);
    }
    // the face towards the viewer on the +z side
    if (!occupied(index, x, y, z + 1)) {
      const quad = [top[2], top[3], drop(top[3]), drop(top[2])];
      into.push(polygon(quad, shade(color, 0.72), opacity));
      quad.forEach(track);
    }
    // and on the +x side
    if (!occupied(index, x + 1, y, z)) {
      const quad = [top[1], top[2], drop(top[2]), drop(top[1])];
      into.push(polygon(quad, shade(color, 0.92), opacity));
      quad.forEach(track);
    }
  }

  const pad = 14;
  const width = maxX - minX + pad * 2;
  const height = maxY - minY + pad * 2;
  const cutaway = cutawayFaces.length
    ? `<g class="voxel-cutaway">${cutawayFaces.join('')}</g>`
    : '';
  const body = `<g transform="translate(${(pad - minX).toFixed(1)} ${(pad - minY).toFixed(1)})">`
    + faces.join('') + cutaway + '</g>';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(0)} ${height.toFixed(0)}"`
    + ` width="${width.toFixed(0)}" height="${height.toFixed(0)}" role="img"`
    + ` aria-label="${escapeAttr(scene.title || 'voxel diagram')}">${body}</svg>`;
}

const escapeAttr = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** True when the scene has a wall drawn see-through to look past. */
const hasCutaway = (scene) => scene.blocks.some((block) => block.cutaway);

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
  // Offered rather than imposed. The near wall is what shows the room is sealed,
  // which is the point of half these diagrams; it is also what stands between
  // the reader and the thing inside. Either can be the one they need.
  const toggle = hasCutaway(scene)
    ? '<button type="button" class="voxel-cutaway-toggle" aria-pressed="false">手前の壁を隠す</button>'
    : '';
  return `<figure class="voxel-figure">${title}<div class="voxel-stage">${svg}</div>`
    + `${toggle}${legend}${caption}</figure>`;
}
