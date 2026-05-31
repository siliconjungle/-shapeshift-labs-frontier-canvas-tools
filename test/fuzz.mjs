import assert from 'node:assert';
import {
  createCanvasSurface,
  createCanvasToolRegistry,
  materializeCanvasFrame
} from '@shapeshift-labs/frontier-canvas';
import {
  bresenhamCells,
  createFillCanvasTool,
  createPaintCanvasTool,
  createRectangleCanvasTool,
  rectCells,
  resizeRectFromHandle,
  scanlineFloodFillCells
} from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 500);
let seed = readPositiveInt(args.seed, 0xcaa7a55);
let checked = 0;

for (let i = 0; i < cases; i++) {
  const a = { x: nextIntRange(-100, 100), y: nextIntRange(-100, 100) };
  const b = { x: nextIntRange(-100, 100), y: nextIntRange(-100, 100) };
  const line = bresenhamCells(a.x, a.y, b.x, b.y);
  assert.deepStrictEqual(line[0], a);
  assert.deepStrictEqual(line[line.length - 1], b);
  assert.ok(line.length <= Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) + 1);
  for (let j = 1; j < line.length; j++) {
    assert.ok(Math.abs(line[j].x - line[j - 1].x) <= 1);
    assert.ok(Math.abs(line[j].y - line[j - 1].y) <= 1);
  }

  const rect = rectCells(a, b, nextBool());
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  assert.ok(rect.every((cell) => cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY));

  const snapshot = makeSnapshot(24, 18);
  const start = { x: nextIntRange(0, 23), y: nextIntRange(0, 17) };
  const fill = scanlineFloodFillCells({
    start,
    snapshot,
    contiguous: true,
    maxCells: 24 * 18
  });
  const seen = new Set(fill.map((cell) => `${cell.x},${cell.y}`));
  assert.strictEqual(seen.size, fill.length);
  assert.ok(fill.length <= 24 * 18);

  const baseRect = {
    x: nextRange(-100, 100),
    y: nextRange(-100, 100),
    width: nextRange(1, 100),
    height: nextRange(1, 100)
  };
  const resized = resizeRectFromHandle(baseRect, ['nw', 'ne', 'se', 'sw'][nextInt(4)], {
    x: nextRange(-50, 50),
    y: nextRange(-50, 50)
  }, { minWidth: 0.5, minHeight: 0.5 });
  assert.ok(resized.width >= 0.5);
  assert.ok(resized.height >= 0.5);
  assert.ok(Number.isFinite(resized.x + resized.y + resized.width + resized.height));

  const surface = createCanvasSurface({
    session: {
      camera: { x: 0, y: 0, zoom: 10 },
      viewport: { width: 320, height: 240 }
    },
    tools: [
      createPaintCanvasTool({ value: 'v', cellsPath: '/cells' }),
      createRectangleCanvasTool({ value: 'r', cellsPath: '/cells' }),
      createFillCanvasTool({ value: 'f', cellsPath: '/cells' })
    ]
  });
  const frame = materializeCanvasFrame({ surface, now: i });
  const registry = createCanvasToolRegistry({ tools: surface.tools, activeToolId: 'canvasTools.paint' });
  const record = registry.dispatch({
    event: {
      type: 'pointermove',
      previousScreen: { x: nextRange(0, 320), y: nextRange(0, 240) },
      screen: { x: nextRange(0, 320), y: nextRange(0, 240) }
    },
    context: {
      surface,
      session: surface.session,
      camera: surface.session.camera,
      viewport: surface.session.viewport,
      frame
    },
    now: i
  });
  assert.ok(record.patches.length >= 1);
  assert.ok(record.patches.every((patch) => patch.path.startsWith('/cells/')));
  checked++;
}

console.log('frontier-canvas-tools fuzz ok: ' + checked + ' cases');

function makeSnapshot(width, height) {
  const cells = {};
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) cells[`${x},${y}`] = nextInt(4) === 0 ? 'wall' : 'floor';
  }
  return { cells, bounds: { x: 0, y: 0, width, height } };
}

function nextRange(min, max) {
  return min + (next() / 0xffffffff) * (max - min);
}

function nextInt(max) {
  return next() % max;
}

function nextIntRange(min, max) {
  return min + nextInt(max - min + 1);
}

function nextBool() {
  return (next() & 1) === 1;
}

function next() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cases') out.cases = argv[++i];
    else if (argv[i] === '--seed') out.seed = argv[++i];
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
