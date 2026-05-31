import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  createCanvasSurface,
  createCanvasToolRegistry,
  materializeCanvasFrame
} from '@shapeshift-labs/frontier-canvas';
import {
  bresenhamCells,
  createCanvasToolsAiManifest,
  createCanvasToolMachine,
  createEntityBrushCanvasTool,
  createEraserCanvasTool,
  createFillCanvasTool,
  createLineCanvasTool,
  createMoveCanvasTool,
  createPaintCanvasTool,
  createRectangleCanvasTool,
  createResizeCanvasTool,
  materializeCanvasTransformHandles,
  rectCells,
  scanlineFloodFillCells,
  selectCanvasTool
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.basename(path.dirname(packageDir)) === 'packages'
  ? path.resolve(packageDir, '..', '..')
  : packageDir;
const args = parseArgs(process.argv.slice(2));
const rounds = readPositiveInt(args.rounds, 40);
const outPath = args.out ? path.resolve(repoRoot, args.out) : null;
const snapshot = makeSnapshot(160, 120);
const tools = [
  createPaintCanvasTool({ value: 'grass', cellsPath: '/cells' }),
  createEraserCanvasTool({ cellsPath: '/cells' }),
  createLineCanvasTool({ value: 'stone', cellsPath: '/cells' }),
  createRectangleCanvasTool({ value: 'wall', cellsPath: '/cells' }),
  createFillCanvasTool({ value: 'water', cellsPath: '/cells' }),
  createEntityBrushCanvasTool({ itemsPath: '/entities', itemsPathMode: 'map' }),
  createMoveCanvasTool({ itemsByIdPath: '/entities' }),
  createResizeCanvasTool({ itemsByIdPath: '/entities' })
];
const surface = createCanvasSurface({
  document: {
    items: Array.from({ length: 2000 }, (_, index) => ({
      id: 'item:' + index,
      x: (index % 80) * 4,
      y: Math.floor(index / 80) * 3,
      width: 2,
      height: 2,
      z: index % 17
    }))
  },
  session: {
    camera: { x: 0, y: 0, zoom: 8 },
    viewport: { width: 1280, height: 720 },
    selectedIds: ['item:1', 'item:2'],
    activeToolId: 'canvasTools.paint'
  },
  tools
});
const frame = materializeCanvasFrame({ surface, now: 1 });
const registry = createCanvasToolRegistry({ tools, activeToolId: 'canvasTools.paint' });
let cursor = 0;

const context = {
  surface,
  session: surface.session,
  camera: surface.session.camera,
  viewport: surface.session.viewport,
  frame
};

const rows = [
  measure('bresenham-512', 2048, () => bresenhamCells(0, 0, 511, 337).length),
  measure('rect-filled-128x96', 128, () => rectCells({ x: 0, y: 0 }, { x: 127, y: 95 }, true).length),
  measure('scanline-fill-160x120', 12, () => scanlineFloodFillCells({
    start: { x: 1, y: 1 },
    snapshot,
    contiguous: true,
    maxCells: 20000
  }).length),
  measure('dispatch-paint-line', 512, () => registry.dispatch({
    toolId: 'canvasTools.paint',
    event: { type: 'pointermove', previousScreen: { x: 0, y: 0 }, screen: { x: 480, y: 320 } },
    context,
    now: cursor++
  }).patches.length),
  measure('dispatch-rect-outline', 256, () => registry.dispatch({
    toolId: 'canvasTools.rect',
    event: { type: 'pointerup', startWorld: { x: 0, y: 0 }, world: { x: 40, y: 30 }, input: { filled: false } },
    context,
    now: cursor++
  }).patches.length),
  measure('dispatch-fill', 32, () => registry.dispatch({
    toolId: 'canvasTools.fill',
    event: { type: 'pointerdown', world: { x: 1, y: 1 }, input: { snapshot } },
    context,
    now: cursor++
  }).patches.length),
  measure('transform-handles', 256, () => materializeCanvasTransformHandles(frame.items, { includeSides: true }).length),
  measure('tool-machine-select', 512, () => selectCanvasTool(createCanvasToolMachine({
    mode: 'tiles',
    activeToolId: 'canvasTools.paint',
    modes: [{ id: 'tiles', toolIds: tools.map((tool) => tool.id), defaultToolId: 'canvasTools.paint' }]
  }), 'canvasTools.rect', { now: cursor++ }).patches.length),
  measure('ai-manifest', 64, () => createCanvasToolsAiManifest({ tools, namespace: 'editor' }).summary.actionCount)
];

const report = {
  package: '@shapeshift-labs/frontier-canvas-tools',
  version: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  rounds,
  rows
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(report.package + ' package benchmark');
console.log('Node ' + report.node + ' on ' + report.platform + ', rounds=' + rounds);
console.log('These are Frontier-only package measurements, not competitor comparisons.');
console.log('');
console.log(padRight('Fixture', 30) + padLeft('Median', 12) + padLeft('p95', 12));
for (const row of rows) {
  console.log(padRight(row.fixture, 30) + padLeft(formatUs(row.medianUs), 12) + padLeft(formatUs(row.p95Us), 12));
}
if (outPath) console.log('\nwrote ' + path.relative(repoRoot, outPath));

function measure(fixture, iterations, fn) {
  const samples = [];
  let checksum = 0;
  for (let round = 0; round < rounds; round++) {
    if (global.gc) global.gc();
    const start = performance.now();
    for (let i = 0; i < iterations; i++) checksum += Number(fn()) || 0;
    samples.push(((performance.now() - start) * 1000) / iterations);
  }
  samples.sort((a, b) => a - b);
  return {
    fixture,
    iterations,
    medianUs: samples[Math.floor(samples.length / 2)],
    p95Us: samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))],
    checksum
  };
}

function makeSnapshot(width, height) {
  const cells = {};
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) cells[`${x},${y}`] = x === 80 ? 'wall' : 'floor';
  }
  return { cells, bounds: { x: 0, y: 0, width, height } };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--rounds') out.rounds = argv[++i];
    else if (argv[i] === '--out') out.out = argv[++i];
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version;
}

function formatUs(value) {
  if (value >= 1000) return (value / 1000).toFixed(2) + 'ms';
  return value.toFixed(2) + 'us';
}

function padRight(value, width) {
  return String(value).padEnd(width, ' ');
}

function padLeft(value, width) {
  return String(value).padStart(width, ' ');
}
