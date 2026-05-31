import assert from 'node:assert';
import {
  createCanvasSurface,
  createCanvasToolRegistry,
  materializeCanvasFrame,
  hitTestCanvas
} from '@shapeshift-labs/frontier-canvas';
import {
  bresenhamCells,
  canUseCanvasTool,
  commitCanvasToolGesture,
  createCanvasToolActions,
  createCanvasToolMachine,
  createCanvasToolsStateLayout,
  createCanvasToolsAiManifest,
  createEntityBrushCanvasTool,
  createEraserCanvasTool,
  createFillCanvasTool,
  createLineCanvasTool,
  createMoveCanvasTool,
  createPaintCanvasTool,
  createRectangleCanvasTool,
  createResizeCanvasTool,
  defineAsyncCanvasTool,
  dispatchAsyncCanvasTool,
  dispatchCanvasToolWithPermissions,
  hitTestCanvasHandle,
  materializeCanvasTransformHandles,
  partitionCanvasToolPatches,
  rectCells,
  scanlineFloodFillCells,
  selectCanvasTool,
  setCanvasToolControl
} from '../dist/index.js';

assert.deepStrictEqual(bresenhamCells(0, 0, 3, 2), [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 2 }
]);
assert.deepStrictEqual(rectCells({ x: 0, y: 0 }, { x: 2, y: 1 }, false), [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: 2, y: 1 }
]);

const tools = [
  createPaintCanvasTool({ value: 'grass', cellsPath: '/level/cells' }),
  createEraserCanvasTool({ cellsPath: '/level/cells' }),
  createLineCanvasTool({ value: 'stone', cellsPath: '/level/cells' }),
  createRectangleCanvasTool({ value: 'wall', cellsPath: '/level/cells' }),
  createFillCanvasTool({ value: 'water', cellsPath: '/level/cells' }),
  createEntityBrushCanvasTool({ itemsPath: '/level/entities', itemsPathMode: 'map', entityType: 'npc' }),
  createMoveCanvasTool({ itemsByIdPath: '/level/entities' }),
  createResizeCanvasTool({ itemsByIdPath: '/level/entities', minWidth: 0.5, minHeight: 0.5 })
];
const registry = createCanvasToolRegistry({ tools, activeToolId: 'canvasTools.paint' });
const surface = createCanvasSurface({
  session: {
    camera: { x: 0, y: 0, zoom: 10 },
    viewport: { width: 200, height: 120 },
    activeToolId: 'canvasTools.paint',
    metadata: { toolSettings: { 'canvasTools.paint': { flipX: true } } }
  },
  tools
});
const frame = materializeCanvasFrame({ surface, now: 1 });
const context = {
  surface,
  session: surface.session,
  camera: surface.session.camera,
  viewport: surface.session.viewport,
  frame
};

const paint = registry.dispatch({
  event: {
    type: 'pointermove',
    previousScreen: { x: 0, y: 0 },
    screen: { x: 30, y: 20 }
  },
  context,
  now: 2
});
assert.strictEqual(paint.status, 'ok');
assert.deepStrictEqual(paint.patches.map((patch) => patch.path), [
  '/level/cells/0,0',
  '/level/cells/1,1',
  '/level/cells/2,1',
  '/level/cells/3,2'
]);
assert.deepStrictEqual(paint.patches[0].value, { value: 'grass', flipX: true });

registry.activeToolId = 'canvasTools.erase';
const erase = registry.dispatch({
  event: { type: 'pointerdown', screen: { x: 10, y: 10 } },
  context,
  now: 3
});
assert.strictEqual(erase.patches[0].op, 'remove');

registry.activeToolId = 'canvasTools.line';
const line = registry.dispatch({
  event: { type: 'pointerup', startWorld: { x: 0, y: 0 }, world: { x: 3, y: 2 } },
  context,
  now: 4
});
assert.ok(line.patches.some((patch) => patch.path === '/level/cells/3,2'));

registry.activeToolId = 'canvasTools.rect';
const rect = registry.dispatch({
  event: {
    type: 'pointerup',
    startWorld: { x: 0, y: 0 },
    world: { x: 2, y: 2 },
    input: { filled: false }
  },
  context,
  now: 5
});
assert.strictEqual(rect.patches.filter((patch) => patch.path.startsWith('/level/cells/')).length, 8);

registry.activeToolId = 'canvasTools.fill';
const fill = registry.dispatch({
  event: {
    type: 'pointerdown',
    world: { x: 0, y: 0 },
    input: {
      snapshot: {
        cells: {
          '0,0': 'a',
          '1,0': 'a',
          '0,1': 'a',
          '3,3': 'a',
          '2,0': 'b'
        },
        bounds: { x: 0, y: 0, width: 4, height: 4 }
      }
    }
  },
  context,
  now: 6
});
assert.deepStrictEqual(fill.patches.map((patch) => patch.path).sort(), [
  '/level/cells/0,0',
  '/level/cells/0,1',
  '/level/cells/1,0'
]);

assert.deepStrictEqual(scanlineFloodFillCells({
  start: { x: 0, y: 0 },
  snapshot: { cells: { '0,0': 'a', '2,0': 'a' }, bounds: { x: 0, y: 0, width: 3, height: 1 } },
  contiguous: false
}), [{ x: 0, y: 0 }, { x: 2, y: 0 }]);

registry.activeToolId = 'canvasTools.entityBrush';
const entity = registry.dispatch({
  event: { type: 'pointerdown', world: { x: 1.2, y: 2.8 }, input: { id: 'npc:1', snapGridWidth: 1, snapGridHeight: 1 } },
  context,
  now: 7
});
assert.strictEqual(entity.patches[0].path, '/level/entities/npc:1');
assert.strictEqual(entity.patches[0].value.x, 1);
assert.strictEqual(entity.patches[0].value.y, 2);

registry.activeToolId = 'canvasTools.move';
const move = registry.dispatch({
  event: {
    type: 'pointerup',
    startWorld: { x: 0, y: 0 },
    world: { x: 2, y: 3 },
    input: { ids: ['npc:1'], startItems: { 'npc:1': { x: 10, y: 20, width: 1, height: 1 } } }
  },
  context,
  now: 8
});
assert.deepStrictEqual(move.patches.map((patch) => [patch.path, patch.value]), [
  ['/level/entities/npc:1/x', 12],
  ['/level/entities/npc:1/y', 23]
]);

registry.activeToolId = 'canvasTools.resize';
const resize = registry.dispatch({
  event: {
    type: 'pointerup',
    input: {
      id: 'npc:1',
      handle: 'se',
      item: { x: 10, y: 20, width: 2, height: 2 },
      startWorld: { x: 0, y: 0 },
      world: { x: 3, y: 4 }
    }
  },
  context,
  now: 9
});
assert.deepStrictEqual(resize.patches.map((patch) => [patch.path, patch.value]), [
  ['/level/entities/npc:1/x', 10],
  ['/level/entities/npc:1/y', 20],
  ['/level/entities/npc:1/width', 5],
  ['/level/entities/npc:1/height', 6]
]);

const handleSurface = createCanvasSurface({
  document: {
    items: [{ id: 'shape:ellipse', x: 0, y: 0, width: 10, height: 6, hitArea: { kind: 'ellipse' } }]
  },
  session: {
    camera: { x: 0, y: 0, zoom: 10 },
    viewport: { width: 200, height: 100 },
    selectedIds: ['shape:ellipse']
  }
});
const handleFrame = materializeCanvasFrame({ surface: handleSurface, now: 10 });
assert.strictEqual(hitTestCanvas({ frame: handleFrame, point: { x: 50, y: 30 }, coordinate: 'screen' }).id, 'shape:ellipse');
assert.strictEqual(hitTestCanvas({ frame: handleFrame, point: { x: 0, y: 0 }, coordinate: 'screen' }), null);
const handles = materializeCanvasTransformHandles(handleFrame.items, { includeSides: true, includeMove: true });
assert.strictEqual(handles.length, 9);
assert.strictEqual(hitTestCanvasHandle(handles, handles[0].screen)?.id, handles[0].id);

let machine = createCanvasToolMachine({
  mode: 'tiles',
  modes: [{ id: 'tiles', toolIds: ['canvasTools.paint', 'canvasTools.erase'], defaultToolId: 'canvasTools.paint' }]
});
assert.strictEqual(machine.stateScope, 'local');
machine = setCanvasToolControl(machine, 'canvasTools.paint', 'flipX', true, { now: 11 }).machine;
assert.strictEqual(machine.settingsByTool['canvasTools.paint'].flipX, true);
const selected = selectCanvasTool(machine, 'canvasTools.erase', { now: 12 });
assert.strictEqual(selected.exitedToolId, 'canvasTools.paint');
assert.strictEqual(commitCanvasToolGesture(selected.machine, { now: 13 }).committed, true);
assert.strictEqual(selected.patches[0].metadata.stateScope, 'local');
const sharedMachine = createCanvasToolMachine({ stateScope: 'crdt', activeToolId: 'canvasTools.paint' });
assert.strictEqual(selectCanvasTool(sharedMachine, 'canvasTools.erase', { now: 14 }).patches[0].metadata.stateScope, 'crdt');
const toolsLayout = createCanvasToolsStateLayout({ rootPath: '/level/canvas' });
assert.ok(toolsLayout.localPaths.includes('/level/canvas/session/preview'));
let toolPartition = partitionCanvasToolPatches([
  { op: 'set', path: '/level/canvas/document/cells/1,1', value: 'grass' },
  { op: 'set', path: '/level/canvas/session/toolMachine', value: sharedMachine }
], toolsLayout);
assert.deepStrictEqual(toolPartition.crdt.map((patch) => patch.path), ['/level/canvas/document/cells/1,1']);
assert.deepStrictEqual(toolPartition.local.map((patch) => patch.path), ['/level/canvas/session/toolMachine']);
const sharedToolsLayout = createCanvasToolsStateLayout({ rootPath: '/level/canvas', machineScope: 'crdt' });
toolPartition = partitionCanvasToolPatches([
  { op: 'set', path: '/level/canvas/session/toolMachine', value: sharedMachine }
], sharedToolsLayout);
assert.deepStrictEqual(toolPartition.crdt.map((patch) => patch.path), ['/level/canvas/session/toolMachine']);

const permission = canUseCanvasTool(tools[0], { capabilities: [] });
assert.strictEqual(permission.allowed, true);
const secureTool = createPaintCanvasTool({ id: 'secure.paint', requires: ['tile.write'] });
assert.strictEqual(canUseCanvasTool(secureTool, { capabilities: [] }).allowed, false);
assert.strictEqual(dispatchCanvasToolWithPermissions(
  createCanvasToolRegistry({ tools: [secureTool], activeToolId: 'secure.paint' }),
  { event: { type: 'pointerdown', world: { x: 0, y: 0 } }, context, now: 14 },
  { capabilities: [] }
).status, 'blocked');

const actions = createCanvasToolActions(tools, { namespace: 'editor' });
assert.strictEqual(actions[0].id, 'editor.canvasTools.paint');
assert.ok(actions[0].metadata.controls.length > 0);
const manifest = createCanvasToolsAiManifest({ tools, namespace: 'editor', package: '@demo/editor' });
assert.strictEqual(manifest.summary.actionCount, tools.length);

const asyncTool = defineAsyncCanvasTool({
  id: 'canvasTools.asyncFill',
  title: 'Async fill',
  handlers: {
    pointerdown: async () => ({ patches: [{ op: 'set', path: '/async/done', value: true }] })
  }
});
const asyncRecord = await dispatchAsyncCanvasTool(asyncTool, {
  event: { type: 'pointerdown' },
  context,
  now: 15
});
assert.strictEqual(asyncRecord.status, 'ok');
assert.strictEqual(asyncRecord.patches[0].path, '/async/done');

console.log('frontier-canvas-tools smoke ok');
