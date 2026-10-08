import { createHash } from 'node:crypto';

/**
 * The Mermaid blocks of a page and the key each one's PNG is published under.
 *
 * The game (MoveEarth's in-game wiki) reads the same Markdown and has to find
 * the same picture for a block without asking anyone, so the key is a hash of
 * the block's own text. Both sides must compute it identically:
 *
 * - a block starts at a line that is exactly "```mermaid" (trailing spaces allowed)
 *   and ends at the next line that is exactly "```";
 * - its source is the lines between, joined with "\n", with trailing whitespace
 *   removed from the end of the whole text;
 * - the key is the first 16 hex digits of the SHA-256 of that source in UTF-8.
 *
 * Change this and the game's build (fetchWiki in MoveEarth-Addtional) must change too.
 */
export function mermaidBlocks(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  const blocks = [];
  let current = null;
  for (const line of lines) {
    if (current === null) {
      if (/^```mermaid\s*$/.test(line)) current = [];
      continue;
    }
    if (/^```\s*$/.test(line)) {
      const source = current.join('\n').replace(/\s+$/, '');
      blocks.push({ source, key: mermaidKey(source) });
      current = null;
      continue;
    }
    current.push(line);
  }
  return blocks;
}

export function mermaidKey(source) {
  return createHash('sha256').update(source, 'utf8').digest('hex').slice(0, 16);
}
