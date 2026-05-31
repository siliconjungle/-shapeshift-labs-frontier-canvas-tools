import type {
  FrontierCanvasAsyncTool,
  FrontierCanvasToolMachine,
  FrontierCanvasToolsStateLayoutInput,
  FrontierCanvasToolPermissionResult
} from '../dist/index.js';
import {
  createCanvasToolsAiManifest,
  createCanvasToolsStateLayout,
  createEntityBrushCanvasTool,
  createPaintCanvasTool,
  defineAsyncCanvasTool
} from '../dist/index.js';

const paint = createPaintCanvasTool({
  value: { tile: 'grass' },
  requires: ['tiles.write'],
  controls: [{ type: 'toggle', id: 'flipX', default: false }]
});

const entity = createEntityBrushCanvasTool({
  entityType: 'characters',
  itemsPathMode: 'map'
});

const manifest = createCanvasToolsAiManifest({
  tools: [paint, entity],
  namespace: 'editor',
  package: '@demo/editor'
});

const asyncTool: FrontierCanvasAsyncTool = defineAsyncCanvasTool({
  id: 'async.tool',
  title: 'Async tool',
  handlers: {
    pointerdown: async () => ({ patches: [{ path: '/ok', value: true }] })
  }
});

const machine: FrontierCanvasToolMachine = {
  kind: 'frontier.canvas-tools.machine',
  version: 1,
  id: 'm',
  mode: 'tiles',
  activeToolId: paint.id,
  phase: 'idle',
  stateScope: 'local',
  modes: [{ id: 'tiles', toolIds: [paint.id], defaultToolId: paint.id }],
  settingsByTool: {},
  updatedAt: 1
};

const layoutInput: FrontierCanvasToolsStateLayoutInput = {
  rootPath: '/editor/canvas',
  machineScope: 'crdt'
};
const layout = createCanvasToolsStateLayout(layoutInput);

const permission: FrontierCanvasToolPermissionResult = {
  allowed: true,
  requiresApproval: false,
  missingCapabilities: [],
  blockedReasons: []
};

void manifest;
void asyncTool;
void machine;
void layout;
void permission;
