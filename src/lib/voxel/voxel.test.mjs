import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVoxel } from './parse.js';
import { renderVoxel, renderFigure } from './render.js';

const SEALED = `
title: 閉鎖
legend:
  # = 壁 #4e5a48
  C = コア #9bc86a
layers:
---
###
###
###
---
###
#C#
###
---
###
###
###
`;

test('空白と凡例にない文字は空間として読み飛ばす', () => {
  const scene = parseVoxel(`
legend:
  # = 壁 #444444
layers:
---
#.#
.#.
`);
  // two on the first row, one on the second
  assert.equal(scene.blocks.length, 3);
});

test('層は下から順に y へ積む', () => {
  const scene = parseVoxel(SEALED);
  const core = scene.blocks.find((b) => b.label === 'コア');
  assert.deepEqual([core.x, core.y, core.z], [1, 1, 1]);
});

test('見出しと凡例を読む', () => {
  const scene = parseVoxel(SEALED);
  assert.equal(scene.title, '閉鎖');
  assert.equal(scene.legend.length, 2);
});

test('ghost は不透明度を落として描く', () => {
  const scene = parseVoxel(`
legend:
  ~ = 透過 #808080 ghost
layers:
---
~
`);
  assert.equal(scene.blocks[0].ghost, true);
  assert.match(renderVoxel(scene), /fill-opacity="0.28"/);
});

test('隠れた面は描かない', () => {
  // A 3x3x3 solid cube: only the three faces that can be seen from the
  // isometric camera are drawn for each visible block, and the block buried in
  // the middle contributes nothing at all.
  const solid = parseVoxel(`
legend:
  # = 壁 #4e5a48
layers:
---
###
###
###
---
###
###
###
---
###
###
###
`);
  const faces = (renderVoxel(solid).match(/<polygon/g) ?? []).length;
  assert.equal(faces, 27, '3x3x3 の立方体は 9+9+9 面だけ見える');
});

test('壁に穴を開けると中が見える', () => {
  const sealed = (renderVoxel(parseVoxel(SEALED)).match(/<polygon/g) ?? []).length;
  const leaking = parseVoxel(SEALED.replace('#C#', '.C#'));
  const holed = (renderVoxel(leaking).match(/<polygon/g) ?? []).length;
  assert.ok(holed > sealed - 3, '穴の周りの面が増えるので、単純に減りはしない');
});

test('ブロックが無ければ何も出さない', () => {
  assert.equal(renderVoxel({ title: '', legend: [], blocks: [] }), '');
});

test('格子のあとに書いた caption を拾い、図には混ぜない', () => {
  const scene = parseVoxel(`
legend:
  C = コア #9bc86a
layers:
---
C
caption: Cを含む説明文
`);
  assert.equal(scene.caption, 'Cを含む説明文');
  assert.equal(scene.blocks.length, 1, 'caption 行からブロックが生えてはいけない');
});

test('a cutaway wall can be switched off without taking the holes with it', () => {
  // Both are drawn see-through and they mean opposite things: one block is
  // still there and one is gone. A switch for the wall must not hide the hole
  // the diagram exists to show.
  const scene = parseVoxel([
    'legend:',
    '  # = wall #4e5a48',
    '  ! = removed #e05a5a ghost',
    '  ~ = near wall #4e5a48 cutaway',
    'layers:',
    '---',
    '#!#',
    '~~~',
  ].join('\n'));

  const near = scene.blocks.filter((block) => block.cutaway);
  const gone = scene.blocks.filter((block) => block.ghost && !block.cutaway);
  assert.equal(near.length, 3);
  assert.equal(gone.length, 1);

  const html = renderFigure(scene);
  assert.ok(html.includes('class="voxel-cutaway"'), 'the near wall is grouped');
  assert.ok(html.includes('voxel-cutaway-toggle'), 'and offered as a switch');
  // The hole must be outside that group, or hiding the wall hides it too.
  // Sliced to the group itself: the legend below carries the same colour as a
  // swatch, and reading past the closing tag would find it there.
  const start = html.indexOf('<g class="voxel-cutaway">');
  const group = html.slice(start, html.indexOf('</g>', start));
  assert.ok(!group.includes('e05a5a'), 'the hole is not inside the group');
  assert.ok(html.includes('e05a5a'), 'but it is still drawn');
});

test('a diagram with no cutaway wall offers no switch', () => {
  const scene = parseVoxel('legend:\n  # = wall #4e5a48\nlayers:\n---\n##\n');
  assert.ok(!renderFigure(scene).includes('voxel-cutaway-toggle'));
});
