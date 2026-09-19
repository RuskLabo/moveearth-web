import { visit } from 'unist-util-visit';
import { parseRounds } from './parse.js';
import { renderFigure } from './render.js';

/** Turns ```rounds blocks into a bar chart of shots needed. */
export default function remarkRounds() {
  return (tree, file) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'rounds' || !parent) return;
      let html;
      try {
        html = renderFigure(parseRounds(node.value));
      } catch (error) {
        console.warn(`[rounds] ${file?.path ?? 'unknown file'}: ${error.message}`);
        return;
      }
      if (html) parent.children[index] = { type: 'html', value: html };
    });
  };
}
