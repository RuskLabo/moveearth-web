/**
 * Reads the text of a `voxel` code block into a scene.
 *
 * The format is layers of characters, bottom layer first, because that is how
 * someone building the thing in game thinks about it. A legend gives each
 * character a colour and a name; anything not in the legend is empty space.
 *
 * Deliberately not JSON or YAML. A wall with a hole in it is a picture, and the
 * point of this format is that the source looks like the picture:
 *
 *     ---
 *     #####
 *     #...#
 *     #.C.#
 *     #...#
 *     #####
 */

// `ghost` is a block drawn see-through because it is not really there any more
// -- a hole in a wall. `cutaway` is a block that is there, drawn see-through so
// the reader can look past it into the room. They render alike and mean
// opposite things, so the reader can be given a switch for one without the
// other disappearing too.
const LEGEND_LINE = /^\s*(\S)\s*=\s*([^#]*?)\s*(#[0-9a-fA-F]{3,8})?\s*(ghost|cutaway)?\s*$/;

export function parseVoxel(source) {
  const lines = String(source).split('\n');
  const legend = new Map();
  const layers = [];
  let title = '';
  let caption = '';
  let section = 'head';
  let current = null;

  const flush = () => {
    if (current && current.length) layers.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() && section !== 'layers') continue;

    if (section !== 'layers') {
      const head = /^\s*(title|caption|legend|layers)\s*:\s*(.*)$/.exec(line);
      if (head) {
        const [, key, rest] = head;
        if (key === 'title') title = rest.trim();
        else if (key === 'caption') caption = rest.trim();
        else if (key === 'legend') section = 'legend';
        else if (key === 'layers') { section = 'layers'; current = []; }
        continue;
      }
      if (section === 'legend') {
        const entry = LEGEND_LINE.exec(line);
        if (entry) {
          const [, char, label, color, modifier] = entry;
          legend.set(char, {
            label: label.trim(),
            color: color || '#4e5a48',
            ghost: modifier === 'ghost' || modifier === 'cutaway',
            cutaway: modifier === 'cutaway',
          });
        }
        continue;
      }
      continue;
    }

    // Still recognised inside the layer section. A caption written after the
    // grid is the natural place for it, and a row of blocks never looks like
    // `caption:` -- without this the line is read as part of the model, which
    // silently drops the text and can sprout stray blocks from its letters.
    const trailing = /^\s*(title|caption)\s*:\s*(.*)$/.exec(line);
    if (trailing) {
      if (trailing[1] === 'title') title = trailing[2].trim();
      else caption = trailing[2].trim();
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) {
      flush();
      current = [];
      continue;
    }
    if (!line.trim()) continue;
    if (current) current.push(line.replace(/^\s\s?/, ''));
  }
  flush();

  const blocks = [];
  layers.forEach((rows, y) => {
    rows.forEach((row, z) => {
      [...row].forEach((char, x) => {
        const kind = legend.get(char);
        if (!kind) return;
        blocks.push({ x, y, z, ...kind });
      });
    });
  });

  return { title, caption, legend: [...legend.values()], blocks };
}
