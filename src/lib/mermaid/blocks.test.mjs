import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mermaidBlocks, mermaidKey } from './blocks.mjs';

test('finds each block and keys it by its trimmed source', () => {
  const page = '# Title\n\n```mermaid\nstateDiagram-v2\n  a --> b\n\n```\n\ntext\n```mermaid  \ngraph TD\n```\n';
  const blocks = mermaidBlocks(page);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].source, 'stateDiagram-v2\n  a --> b');
  assert.equal(blocks[0].key, mermaidKey('stateDiagram-v2\n  a --> b'));
  assert.equal(blocks[1].source, 'graph TD');
});

test('a key is sixteen hex digits and stable across line endings', () => {
  const unix = mermaidBlocks('```mermaid\ngraph TD\n  x\n```');
  const windows = mermaidBlocks('```mermaid\r\ngraph TD\r\n  x\r\n```');
  assert.match(unix[0].key, /^[0-9a-f]{16}$/);
  assert.equal(unix[0].key, windows[0].key);
});

test('other code blocks are ignored', () => {
  assert.deepEqual(mermaidBlocks('```voxel\nlayers:\n```\n```js\nx\n```'), []);
});
