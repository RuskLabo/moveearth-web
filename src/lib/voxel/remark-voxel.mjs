import { visit } from 'unist-util-visit';
import { parseVoxel } from './parse.js';
import { renderFigure } from './render.js';

/**
 * Turns ```voxel code blocks into isometric SVG, the same way the Mermaid
 * plugin turns ```mermaid ones into diagrams.
 */
export default function remarkVoxel() {
  return (tree, file) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'voxel' || !parent) return;
      let html;
      try {
        html = renderFigure(parseVoxel(node.value));
      } catch (error) {
        // A broken diagram must not take the build down with it; the page is
        // still worth publishing, and the warning says which file to look at.
        console.warn(`[voxel] ${file?.path ?? 'unknown file'}: ${error.message}`);
        return;
      }
      if (!html) return;
      parent.children[index] = { type: 'html', value: html };
    });
  };
}
