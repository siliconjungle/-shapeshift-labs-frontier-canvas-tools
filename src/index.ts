import type { JsonObject, JsonValue } from '@shapeshift-labs/frontier';
import { normalizeFrontierRegistryPath } from '@shapeshift-labs/frontier/registry';
import {
  createCanvasStateLayout,
  defineCanvasTool,
  dispatchCanvasTool,
  partitionCanvasPatches,
  screenToWorld,
  type FrontierCanvasFrame,
  type FrontierCanvasFrameItem,
  type FrontierCanvasHandle,
  type FrontierCanvasPatchInput,
  type FrontierCanvasPoint,
  type FrontierCanvasRect,
  type FrontierCanvasSession,
  type FrontierCanvasStateLayout,
  type FrontierCanvasStatePathInput,
  type FrontierCanvasStateScope,
  type FrontierCanvasTool,
  type FrontierCanvasToolContext,
  type FrontierCanvasToolControlInput,
  type FrontierCanvasToolDispatchRequest,
  type FrontierCanvasToolEvent,
  type FrontierCanvasToolInput,
  type FrontierCanvasToolRecord,
  type FrontierCanvasToolRegistry,
  type FrontierCanvasToolResult
} from '@shapeshift-labs/frontier-canvas';
import {
  createToolsManifest,
  type FrontierToolActionInput,
  type FrontierToolsManifest
} from '@shapeshift-labs/frontier-tools';

export const FRONTIER_CANVAS_TOOLS_MACHINE_KIND = 'frontier.canvas-tools.machine';
export const FRONTIER_CANVAS_TOOLS_MACHINE_VERSION = 1;
export const FRONTIER_CANVAS_ASYNC_TOOL_TASK_KIND = 'frontier.canvas-tools.async-task';
export const FRONTIER_CANVAS_ASYNC_TOOL_TASK_VERSION = 1;

export type FrontierCanvasCellOp = 'set' | 'remove';
export type FrontierCanvasToolPhase =
  | 'idle'
  | 'hover'
  | 'pointing'
  | 'dragging'
  | 'preview'
  | 'committed'
  | 'cancelled'
  | 'async'
  | string;
export type FrontierCanvasAsyncToolTaskStatus = 'pending' | 'ok' | 'error' | 'cancelled' | string;

export interface FrontierCanvasCell {
  x: number;
  y: number;
}

export interface FrontierCanvasGridToolPaths {
  cellsPath?: string;
  previewPath?: string | null;
  activeValuePath?: string;
}

export interface FrontierCanvasGridToolOptions<TState = unknown> extends Omit<FrontierCanvasToolInput<TState>, 'id' | 'handlers' | 'controls'> {
  id?: string;
  cellsPath?: string;
  previewPath?: string | null;
  activeValuePath?: string;
  cellSize?: number;
  value?: unknown;
  emptyValue?: unknown;
  maxCells?: number;
  controls?: readonly FrontierCanvasToolControlInput[];
}

export interface FrontierCanvasFillSnapshot {
  cells: FrontierCanvasFillCells;
  bounds?: FrontierCanvasRect;
}

export type FrontierCanvasFillCells = Record<string, JsonValue> | ReadonlyMap<string, JsonValue>;

interface FrontierCanvasCellSnapshotIndex {
  size: number;
  get(key: string): JsonValue | undefined;
  getAt(x: number, y: number): JsonValue | undefined;
  entries(): IterableIterator<[string, JsonValue]>;
  keys(): IterableIterator<string>;
}

export interface FrontierCanvasEntityBrushOptions<TState = unknown> extends Omit<FrontierCanvasToolInput<TState>, 'id' | 'handlers' | 'controls'> {
  id?: string;
  itemsPath?: string | null;
  itemsPathMode?: 'array' | 'map';
  entityType?: string;
  width?: number;
  height?: number;
  layer?: string;
  z?: number;
  controls?: readonly FrontierCanvasToolControlInput[];
}

export interface FrontierCanvasTransformToolOptions<TState = unknown> extends Omit<FrontierCanvasToolInput<TState>, 'id' | 'handlers'> {
  id?: string;
  itemsByIdPath?: string;
  minWidth?: number;
  minHeight?: number;
}

export interface FrontierCanvasToolPermissionContext {
  capabilities?: readonly string[];
  policyDecision?: {
    allowed?: boolean;
    access?: string;
    requiresApproval?: boolean;
    allowedTools?: readonly string[];
    deniedTools?: readonly string[];
    reasons?: readonly string[];
  } | null;
}

export interface FrontierCanvasToolPermissionResult {
  allowed: boolean;
  requiresApproval: boolean;
  missingCapabilities: string[];
  blockedReasons: string[];
}

export interface FrontierCanvasToolModeInput {
  id: string;
  title?: string;
  toolIds?: readonly string[];
  defaultToolId?: string;
  metadata?: unknown;
}

export interface FrontierCanvasToolMode {
  id: string;
  title?: string;
  toolIds: string[];
  defaultToolId?: string;
  metadata?: JsonObject;
}

export interface FrontierCanvasHoverPreviewInput {
  id?: string;
  toolId?: string;
  cells?: readonly FrontierCanvasCell[];
  rect?: FrontierCanvasRect;
  itemIds?: readonly string[];
  metadata?: unknown;
}

export interface FrontierCanvasHoverPreview {
  id: string;
  toolId?: string;
  cells: FrontierCanvasCell[];
  rect?: FrontierCanvasRect;
  itemIds: string[];
  metadata?: JsonObject;
}

export interface FrontierCanvasToolMachineInput {
  id?: string;
  mode?: string;
  activeToolId?: string;
  phase?: FrontierCanvasToolPhase;
  stateScope?: FrontierCanvasStateScope;
  modes?: readonly FrontierCanvasToolModeInput[];
  settingsByTool?: Record<string, unknown>;
  capturedPointerId?: string | number | null;
  capturedGestureId?: string | number | null;
  hoverPreview?: FrontierCanvasHoverPreviewInput | null;
  metadata?: unknown;
}

export interface FrontierCanvasToolMachine {
  kind: typeof FRONTIER_CANVAS_TOOLS_MACHINE_KIND;
  version: typeof FRONTIER_CANVAS_TOOLS_MACHINE_VERSION;
  id: string;
  mode: string;
  activeToolId: string;
  phase: FrontierCanvasToolPhase;
  stateScope: FrontierCanvasStateScope;
  modes: FrontierCanvasToolMode[];
  settingsByTool: Record<string, JsonObject>;
  capturedPointerId?: string | number | null;
  capturedGestureId?: string | number | null;
  hoverPreview?: FrontierCanvasHoverPreview | null;
  updatedAt: number;
  metadata?: JsonObject;
}

export interface FrontierCanvasToolMachineTransition {
  machine: FrontierCanvasToolMachine;
  patches: FrontierCanvasPatchInput[];
  enteredToolId?: string;
  exitedToolId?: string;
  committed?: boolean;
  cancelled?: boolean;
}

export interface FrontierCanvasAsyncToolTask {
  kind: typeof FRONTIER_CANVAS_ASYNC_TOOL_TASK_KIND;
  version: typeof FRONTIER_CANVAS_ASYNC_TOOL_TASK_VERSION;
  id: string;
  toolId: string;
  eventType: string;
  status: FrontierCanvasAsyncToolTaskStatus;
  startedAt: number;
  endedAt?: number;
  patches: FrontierCanvasPatchInput[];
  message?: string;
  metadata?: JsonObject;
}

export type FrontierCanvasAsyncToolHandler<TState = unknown> = (
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent
) => FrontierCanvasToolResult | void | Promise<FrontierCanvasToolResult | void>;

export interface FrontierCanvasAsyncToolInput<TState = unknown> extends Omit<FrontierCanvasToolInput<TState>, 'handlers'> {
  handlers: Partial<Record<string, FrontierCanvasAsyncToolHandler<TState>>>;
}

export interface FrontierCanvasAsyncTool<TState = unknown> {
  tool: FrontierCanvasTool<TState>;
  handlers: ReadonlyMap<string, FrontierCanvasAsyncToolHandler<TState>>;
}

export interface FrontierCanvasToolsStateLayoutInput {
  rootPath?: string;
  documentScope?: FrontierCanvasStateScope;
  sessionScope?: FrontierCanvasStateScope;
  cellsPath?: string;
  cellsScope?: FrontierCanvasStateScope;
  itemsPath?: string;
  itemsScope?: FrontierCanvasStateScope;
  itemsByIdPath?: string;
  itemsByIdScope?: FrontierCanvasStateScope;
  activeValuePath?: string;
  activeValueScope?: FrontierCanvasStateScope;
  previewPath?: string | null;
  previewScope?: FrontierCanvasStateScope;
  machinePath?: string;
  machineScope?: FrontierCanvasStateScope;
  asyncTasksPath?: string;
  asyncTasksScope?: FrontierCanvasStateScope;
  extraPaths?: readonly FrontierCanvasStatePathInput[];
  metadata?: unknown;
}

const DEFAULT_CELLS_PATH = '/canvas/document/cells';
const DEFAULT_PREVIEW_PATH = '/canvas/session/preview';
const DEFAULT_ITEMS_PATH = '/canvas/document/items';
const DEFAULT_ITEMS_BY_ID_PATH = '/canvas/document/itemsById';
const DEFAULT_MACHINE_PATH = '/canvas/session/toolMachine';

const FLIP_CONTROLS: FrontierCanvasToolControlInput[] = [
  { type: 'toggle', id: 'flipX', label: 'Flip X', default: false },
  { type: 'toggle', id: 'flipY', label: 'Flip Y', default: false }
];

const SNAP_CONTROLS: FrontierCanvasToolControlInput[] = [
  { type: 'toggle', id: 'snapX', label: 'Snap X', default: true },
  { type: 'toggle', id: 'snapY', label: 'Snap Y', default: true },
  { type: 'number', id: 'snapGridWidth', label: 'Grid W', default: 1, min: 0.000001, step: 0.05 },
  { type: 'number', id: 'snapGridHeight', label: 'Grid H', default: 1, min: 0.000001, step: 0.05 }
];

export function bresenhamCells(x0: number, y0: number, x1: number, y1: number): FrontierCanvasCell[] {
  let cx = Math.trunc(x0);
  let cy = Math.trunc(y0);
  const tx = Math.trunc(x1);
  const ty = Math.trunc(y1);
  const dx = Math.abs(tx - cx);
  const sx = cx < tx ? 1 : -1;
  const dy = -Math.abs(ty - cy);
  const sy = cy < ty ? 1 : -1;
  const cells: FrontierCanvasCell[] = new Array(Math.max(dx, -dy) + 1);
  let index = 0;
  let err = dx + dy;
  for (;;) {
    cells[index++] = { x: cx, y: cy };
    if (cx === tx && cy === ty) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      cx += sx;
    }
    if (e2 <= dx) {
      err += dx;
      cy += sy;
    }
  }
  return cells;
}

export function rectCells(start: FrontierCanvasCell, end: FrontierCanvasCell, filled = true): FrontierCanvasCell[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  if (filled) {
    const cells: FrontierCanvasCell[] = new Array(width * height);
    let index = 0;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) cells[index++] = { x, y };
    }
    return cells;
  }
  if (width === 1 || height === 1) {
    const cells: FrontierCanvasCell[] = new Array(width * height);
    let index = 0;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) cells[index++] = { x, y };
    }
    return cells;
  }
  const cells: FrontierCanvasCell[] = new Array(width * 2 + Math.max(0, height - 2) * 2);
  let index = 0;
  for (let x = minX; x <= maxX; x++) cells[index++] = { x, y: minY };
  for (let x = minX; x <= maxX; x++) cells[index++] = { x, y: maxY };
  for (let y = minY + 1; y < maxY; y++) {
    cells[index++] = { x: minX, y };
    cells[index++] = { x: maxX, y };
  }
  return cells;
}

export function scanlineFloodFillCells(input: {
  start: FrontierCanvasCell;
  snapshot: FrontierCanvasFillSnapshot;
  targetValue?: unknown;
  contiguous?: boolean;
  maxCells?: number;
  emptyValue?: unknown;
}): FrontierCanvasCell[] {
  const start = { x: Math.trunc(input.start.x), y: Math.trunc(input.start.y) };
  const cells = normalizeCellSnapshot(input.snapshot.cells);
  const bounds = input.snapshot.bounds ?? boundsForSnapshot(cells) ?? { x: start.x, y: start.y, width: 1, height: 1 };
  const maxCells = Math.max(1, Math.floor(input.maxCells ?? 100000));
  const emptyValue = toJsonValue(input.emptyValue ?? null);
  const target = input.targetValue === undefined ? readSnapshotCell(cells, start, emptyValue) : toJsonValue(input.targetValue);
  const matchesTarget = createJsonMatcher(target);
  if (input.contiguous === false) {
    const selected: FrontierCanvasCell[] = [];
    for (const [key, value] of cells.entries()) {
      if (matchesTarget(value)) {
        selected.push(cellFromKey(key));
        if (selected.length >= maxCells) break;
      }
    }
    return selected.sort(compareCells);
  }
  const minX = Math.floor(bounds.x);
  const minY = Math.floor(bounds.y);
  const maxX = Math.floor(bounds.x + Math.max(0, bounds.width) - 1);
  const maxY = Math.floor(bounds.y + Math.max(0, bounds.height) - 1);
  if (maxX < minX || maxY < minY || start.x < minX || start.x > maxX || start.y < minY || start.y > maxY) return [];
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const area = width * height;
  if (area > 0 && area <= 1000000) {
    return scanlineFloodFillIndexed(cells, start, matchesTarget, minX, minY, maxX, maxY, width, area, maxCells, emptyValue);
  }
  const inBounds = (cell: FrontierCanvasCell) => cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY;
  const visited = new Set<string>();
  const out: FrontierCanvasCell[] = [];
  const stack: FrontierCanvasCell[] = [start];
  while (stack.length && out.length < maxCells) {
    const seed = stack.pop();
    if (!seed || !inBounds(seed)) continue;
    let left = seed.x;
    while (left >= minX && !visited.has(cellKey(left, seed.y)) && matchesTarget(readSnapshotCellAt(cells, left, seed.y, emptyValue))) left--;
    left++;
    let right = seed.x;
    while (right <= maxX && !visited.has(cellKey(right, seed.y)) && matchesTarget(readSnapshotCellAt(cells, right, seed.y, emptyValue))) right++;
    right--;
    if (right < left) continue;
    for (let x = left; x <= right && out.length < maxCells; x++) {
      const key = cellKey(x, seed.y);
      visited.add(key);
      out.push({ x, y: seed.y });
    }
    enqueueFloodRuns(stack, cells, visited, matchesTarget, seed.y - 1, left, right, minY, maxY, emptyValue);
    enqueueFloodRuns(stack, cells, visited, matchesTarget, seed.y + 1, left, right, minY, maxY, emptyValue);
  }
  return out;
}

export function createPaintCanvasTool<TState = unknown>(
  options: FrontierCanvasGridToolOptions<TState> = {}
): FrontierCanvasTool<TState> {
  const cellsPath = options.cellsPath ?? DEFAULT_CELLS_PATH;
  const controls = [...FLIP_CONTROLS, ...(options.controls ?? [])];
  return defineCanvasTool({
    ...options,
    id: options.id ?? 'canvasTools.paint',
    title: options.title ?? 'Paint',
    description: options.description ?? 'Paint grid cells with the active value.',
    icon: options.icon ?? 'paintbrush',
    cursor: options.cursor ?? 'crosshair',
    events: uniqueStrings([...(options.events ?? []), 'pointerdown', 'pointermove']),
    reads: uniqueStrings([...(options.reads ?? []), options.activeValuePath ?? '/canvas/session/activeValue']),
    writes: uniqueStrings([...(options.writes ?? []), cellsPath]),
    controls,
    handlers: {
      pointerdown: (context, event) => ({ patches: paintPatchesForEvent(context, event, options, false) }),
      pointermove: (context, event) => ({ patches: paintPatchesForEvent(context, event, options, true) })
    }
  });
}

export function createEraserCanvasTool<TState = unknown>(
  options: FrontierCanvasGridToolOptions<TState> = {}
): FrontierCanvasTool<TState> {
  const cellsPath = options.cellsPath ?? DEFAULT_CELLS_PATH;
  return defineCanvasTool({
    ...options,
    id: options.id ?? 'canvasTools.erase',
    title: options.title ?? 'Erase',
    description: options.description ?? 'Erase grid cells using the same raster line path as paint.',
    icon: options.icon ?? 'eraser',
    cursor: options.cursor ?? 'cell',
    events: uniqueStrings([...(options.events ?? []), 'pointerdown', 'pointermove']),
    writes: uniqueStrings([...(options.writes ?? []), cellsPath]),
    handlers: {
      pointerdown: (context, event) => ({ patches: erasePatchesForEvent(context, event, options, false) }),
      pointermove: (context, event) => ({ patches: erasePatchesForEvent(context, event, options, true) })
    }
  });
}

export function createLineCanvasTool<TState = unknown>(
  options: FrontierCanvasGridToolOptions<TState> = {}
): FrontierCanvasTool<TState> {
  const cellsPath = options.cellsPath ?? DEFAULT_CELLS_PATH;
  const previewPath = options.previewPath === undefined ? DEFAULT_PREVIEW_PATH : options.previewPath;
  return defineCanvasTool({
    ...options,
    id: options.id ?? 'canvasTools.line',
    title: options.title ?? 'Line',
    description: options.description ?? 'Paint a grid line using Bresenham rasterization.',
    icon: options.icon ?? 'slash',
    cursor: options.cursor ?? 'crosshair',
    events: uniqueStrings([...(options.events ?? []), 'pointermove', 'pointerup', 'keydown']),
    reads: uniqueStrings([...(options.reads ?? []), options.activeValuePath ?? '/canvas/session/activeValue']),
    writes: uniqueStrings([...(options.writes ?? []), cellsPath, ...(previewPath ? [previewPath] : [])]),
    controls: [...FLIP_CONTROLS, ...(options.controls ?? [])],
    handlers: {
      pointermove: (context, event) => previewCellsResult(context, event, options, lineCellsForEvent(context, event, options), 'line'),
      pointerup: (context, event) => commitCellsResult(context, event, options, lineCellsForEvent(context, event, options)),
      keydown: (_context, event) => event.key === 'Escape' ? clearPreviewResult(previewPath) : { status: 'ignored' }
    }
  });
}

export function createRectangleCanvasTool<TState = unknown>(
  options: FrontierCanvasGridToolOptions<TState> = {}
): FrontierCanvasTool<TState> {
  const cellsPath = options.cellsPath ?? DEFAULT_CELLS_PATH;
  const previewPath = options.previewPath === undefined ? DEFAULT_PREVIEW_PATH : options.previewPath;
  return defineCanvasTool({
    ...options,
    id: options.id ?? 'canvasTools.rect',
    title: options.title ?? 'Rectangle',
    description: options.description ?? 'Paint a filled or outline rectangle on a grid.',
    icon: options.icon ?? 'square',
    cursor: options.cursor ?? 'crosshair',
    events: uniqueStrings([...(options.events ?? []), 'pointermove', 'pointerup', 'keydown']),
    reads: uniqueStrings([...(options.reads ?? []), options.activeValuePath ?? '/canvas/session/activeValue']),
    writes: uniqueStrings([...(options.writes ?? []), cellsPath, ...(previewPath ? [previewPath] : [])]),
    controls: [{ type: 'toggle', id: 'filled', label: 'Filled', default: true }, ...FLIP_CONTROLS, ...(options.controls ?? [])],
    handlers: {
      pointermove: (context, event) => previewCellsResult(context, event, options, rectCellsForEvent(context, event, options), 'rect'),
      pointerup: (context, event) => commitCellsResult(context, event, options, rectCellsForEvent(context, event, options)),
      keydown: (_context, event) => event.key === 'Escape' ? clearPreviewResult(previewPath) : { status: 'ignored' }
    }
  });
}

export function createFillCanvasTool<TState = unknown>(
  options: FrontierCanvasGridToolOptions<TState> = {}
): FrontierCanvasTool<TState> {
  const cellsPath = options.cellsPath ?? DEFAULT_CELLS_PATH;
  return defineCanvasTool({
    ...options,
    id: options.id ?? 'canvasTools.fill',
    title: options.title ?? 'Fill',
    description: options.description ?? 'Fill matching grid cells with a scanline flood-fill plan.',
    icon: options.icon ?? 'fill',
    cursor: options.cursor ?? 'crosshair',
    events: uniqueStrings([...(options.events ?? []), 'pointerdown']),
    reads: uniqueStrings([...(options.reads ?? []), cellsPath, options.activeValuePath ?? '/canvas/session/activeValue']),
    writes: uniqueStrings([...(options.writes ?? []), cellsPath]),
    controls: [{ type: 'toggle', id: 'contiguous', label: 'Contiguous', default: true }, ...FLIP_CONTROLS, ...(options.controls ?? [])],
    handlers: {
      pointerdown(context, event) {
        const start = cellFromEvent(context, event, options);
        if (!start) return { status: 'ignored', message: 'fill requires a pointer location' };
        const snapshot = readFillSnapshot(event, context);
        const cells = scanlineFloodFillCells({
          start,
          snapshot,
          contiguous: readControlBoolean(context, event, 'contiguous', true),
          maxCells: readControlNumber(context, event, 'maxCells', options.maxCells ?? 100000),
          emptyValue: options.emptyValue
        });
        const value = paintValueForEvent(context, event, options);
        return { patches: cellWritePatches(cells, value, { cellsPath, op: 'set' }) };
      }
    }
  });
}

export function createEntityBrushCanvasTool<TState = unknown>(
  options: FrontierCanvasEntityBrushOptions<TState> = {}
): FrontierCanvasTool<TState> {
  const itemsPath = options.itemsPath ?? DEFAULT_ITEMS_PATH;
  return defineCanvasTool({
    ...options,
    id: options.id ?? 'canvasTools.entityBrush',
    title: options.title ?? 'Place entity',
    description: options.description ?? 'Place a normalized entity/item on a canvas surface.',
    icon: options.icon ?? 'box-plus',
    cursor: options.cursor ?? 'crosshair',
    events: uniqueStrings([...(options.events ?? []), 'pointerdown', 'pointermove', 'keydown']),
    writes: uniqueStrings([...(options.writes ?? []), itemsPath, DEFAULT_PREVIEW_PATH]),
    controls: [...SNAP_CONTROLS, ...FLIP_CONTROLS, ...(options.controls ?? [])],
    handlers: {
      pointermove(context, event) {
        const point = entityPointFromEvent(context, event, options);
        if (!point) return { status: 'ignored', message: 'entity brush preview requires a pointer location' };
        return {
          patches: [{ op: 'set', path: DEFAULT_PREVIEW_PATH, value: { kind: 'entity', point } }]
        };
      },
      pointerdown(context, event) {
        const point = entityPointFromEvent(context, event, options);
        if (!point) return { status: 'ignored', message: 'entity brush requires a pointer location' };
        const input = asObject(event.input);
        const entity = {
          id: readString(input.id, 'entity:' + stableHash([point, input.type ?? options.entityType ?? 'entity'])),
          type: readString(input.type, options.entityType ?? 'entity'),
          x: point.x,
          y: point.y,
          width: readFinite(input.width, options.width ?? 1),
          height: readFinite(input.height, options.height ?? 1),
          ...(input.layer || options.layer ? { layer: readString(input.layer, options.layer ?? '') } : {}),
          z: readFinite(input.z, options.z ?? 0),
          ...(readControlBoolean(context, event, 'flipX', false) ? { flipX: true } : {}),
          ...(readControlBoolean(context, event, 'flipY', false) ? { flipY: true } : {}),
          ...asObject(input.value)
        };
        const patch = options.itemsPathMode === 'map'
          ? { op: 'set', path: joinPath(itemsPath, entity.id), value: entity }
          : { op: 'add', path: joinPath(itemsPath, '-'), value: entity };
        return { patches: [patch, { op: 'remove', path: DEFAULT_PREVIEW_PATH }] };
      },
      keydown: (_context, event) => event.key === 'Escape' ? clearPreviewResult(DEFAULT_PREVIEW_PATH) : { status: 'ignored' }
    }
  });
}

export function createMoveCanvasTool<TState = unknown>(
  options: FrontierCanvasTransformToolOptions<TState> = {}
): FrontierCanvasTool<TState> {
  const itemsPath = options.itemsByIdPath ?? DEFAULT_ITEMS_BY_ID_PATH;
  return defineCanvasTool({
    ...options,
    id: options.id ?? 'canvasTools.move',
    title: options.title ?? 'Move selection',
    description: options.description ?? 'Move selected items by a world-space pointer delta.',
    icon: options.icon ?? 'move',
    cursor: options.cursor ?? 'move',
    events: uniqueStrings([...(options.events ?? []), 'pointermove', 'pointerup']),
    writes: uniqueStrings([...(options.writes ?? []), itemsPath]),
    handlers: {
      pointermove: (context, event) => ({ patches: moveItemPatches(context, event, itemsPath) }),
      pointerup: (context, event) => ({ patches: moveItemPatches(context, event, itemsPath) })
    }
  });
}

export function createResizeCanvasTool<TState = unknown>(
  options: FrontierCanvasTransformToolOptions<TState> = {}
): FrontierCanvasTool<TState> {
  const itemsPath = options.itemsByIdPath ?? DEFAULT_ITEMS_BY_ID_PATH;
  return defineCanvasTool({
    ...options,
    id: options.id ?? 'canvasTools.resize',
    title: options.title ?? 'Resize item',
    description: options.description ?? 'Resize an item from a transform handle.',
    icon: options.icon ?? 'resize',
    cursor: options.cursor ?? 'nwse-resize',
    events: uniqueStrings([...(options.events ?? []), 'pointermove', 'pointerup']),
    writes: uniqueStrings([...(options.writes ?? []), itemsPath]),
    handlers: {
      pointermove: (_context, event) => ({ patches: resizeItemPatches(event, itemsPath, options) }),
      pointerup: (_context, event) => ({ patches: resizeItemPatches(event, itemsPath, options) })
    }
  });
}

export function materializeCanvasTransformHandles(
  items: readonly FrontierCanvasFrameItem[],
  options: { includeSides?: boolean; includeMove?: boolean; size?: number } = {}
): FrontierCanvasHandle[] {
  const handles: FrontierCanvasHandle[] = [];
  const includeSides = options.includeSides === true;
  const includeMove = options.includeMove !== false;
  const size = Math.max(1, readFinite(options.size, 8));
  const specs: Array<[string, number, number, string]> = [
    ['nw', 0, 0, 'nwse-resize'],
    ['ne', 1, 0, 'nesw-resize'],
    ['se', 1, 1, 'nwse-resize'],
    ['sw', 0, 1, 'nesw-resize'],
    ...(includeSides ? [
      ['n', 0.5, 0, 'ns-resize'],
      ['e', 1, 0.5, 'ew-resize'],
      ['s', 0.5, 1, 'ns-resize'],
      ['w', 0, 0.5, 'ew-resize']
    ] as Array<[string, number, number, string]> : [])
  ];
  for (const item of items) {
    if (!item.selected) continue;
    if (includeMove) {
      handles.push({
        id: item.id + ':handle:move',
        itemId: item.id,
        kind: 'move',
        edge: 'center',
        world: { x: item.x + item.width * 0.5, y: item.y + item.height * 0.5 },
        screen: { x: item.screen.x + item.screen.width * 0.5, y: item.screen.y + item.screen.height * 0.5 },
        cursor: 'move',
        metadata: { size }
      });
    }
    for (const [edge, fx, fy, cursor] of specs) {
      handles.push({
        id: item.id + ':handle:' + edge,
        itemId: item.id,
        kind: 'resize',
        edge,
        world: { x: item.x + item.width * fx, y: item.y + item.height * fy },
        screen: { x: item.screen.x + item.screen.width * fx, y: item.screen.y + item.screen.height * fy },
        cursor,
        metadata: { size }
      });
    }
  }
  return handles;
}

export function hitTestCanvasHandle(
  handles: readonly FrontierCanvasHandle[],
  point: FrontierCanvasPoint,
  tolerance = 6
): FrontierCanvasHandle | null {
  let best: { handle: FrontierCanvasHandle; distance: number } | null = null;
  for (const handle of handles) {
    const size = readFinite(handle.metadata?.size, tolerance);
    const radius = Math.max(tolerance, size * 0.5);
    const distance = Math.hypot(point.x - handle.screen.x, point.y - handle.screen.y);
    if (distance <= radius && (!best || distance < best.distance)) best = { handle, distance };
  }
  return best?.handle ?? null;
}

export function createCanvasToolsStateLayout(input: FrontierCanvasToolsStateLayoutInput = {}): FrontierCanvasStateLayout {
  const rootPath = normalizeFrontierRegistryPath(input.rootPath ?? '/canvas');
  const documentScope = normalizeToolStateScope(input.documentScope, 'crdt');
  const sessionScope = normalizeToolStateScope(input.sessionScope, 'local');
  const previewPath = input.previewPath === null
    ? null
    : input.previewPath
      ? normalizeFrontierRegistryPath(input.previewPath)
      : defaultToolStatePath(rootPath, 'session', 'preview');
  const extraPaths: FrontierCanvasStatePathInput[] = [
    {
      id: 'canvas.document.cells',
      role: 'cells',
      path: input.cellsPath ?? defaultToolStatePath(rootPath, 'document', 'cells'),
      scope: normalizeToolStateScope(input.cellsScope, documentScope)
    },
    {
      id: 'canvas.document.itemsById',
      role: 'itemsById',
      path: input.itemsByIdPath ?? defaultToolStatePath(rootPath, 'document', 'itemsById'),
      scope: normalizeToolStateScope(input.itemsByIdScope, documentScope)
    },
    {
      id: 'canvas.tools.activeValue',
      role: 'activeValue',
      path: input.activeValuePath ?? defaultToolStatePath(rootPath, 'session', 'activeValue'),
      scope: normalizeToolStateScope(input.activeValueScope, sessionScope),
      ephemeral: normalizeToolStateScope(input.activeValueScope, sessionScope) === 'local'
    },
    {
      id: 'canvas.tools.machine',
      role: 'toolMachine',
      path: input.machinePath ?? defaultToolStatePath(rootPath, 'session', 'toolMachine'),
      scope: normalizeToolStateScope(input.machineScope, sessionScope),
      ephemeral: normalizeToolStateScope(input.machineScope, sessionScope) === 'local'
    },
    {
      id: 'canvas.tools.asyncTasks',
      role: 'asyncTasks',
      path: input.asyncTasksPath ?? defaultToolStatePath(rootPath, 'session', 'toolTasks'),
      scope: normalizeToolStateScope(input.asyncTasksScope, sessionScope),
      ephemeral: normalizeToolStateScope(input.asyncTasksScope, sessionScope) === 'local'
    }
  ];
  const defaultItemsPath = defaultToolStatePath(rootPath, 'document', 'items');
  const itemsPath = input.itemsPath === null ? null : input.itemsPath ? normalizeFrontierRegistryPath(input.itemsPath) : defaultItemsPath;
  if (itemsPath && itemsPath !== defaultItemsPath) {
    extraPaths.push({
      id: 'canvas.document.items.map',
      role: 'items',
      path: itemsPath,
      scope: normalizeToolStateScope(input.itemsScope, documentScope)
    });
  }
  if (previewPath) {
    extraPaths.push({
      id: 'canvas.tools.preview',
      role: 'preview',
      path: previewPath,
      scope: normalizeToolStateScope(input.previewScope, sessionScope),
      ephemeral: true
    });
  }
  return createCanvasStateLayout({
    rootPath,
    scopes: {
      document: documentScope,
      items: normalizeToolStateScope(input.itemsScope, documentScope),
      session: sessionScope
    },
    extraPaths: [...extraPaths, ...(input.extraPaths ?? [])],
    metadata: input.metadata
  });
}

export function partitionCanvasToolPatches(
  patches: readonly FrontierCanvasPatchInput[],
  input: FrontierCanvasToolsStateLayoutInput | FrontierCanvasStateLayout = {}
) {
  const layout = isCanvasToolsStateLayout(input) ? input : createCanvasToolsStateLayout(input);
  return partitionCanvasPatches(patches, layout);
}

export function createCanvasToolMachine(input: FrontierCanvasToolMachineInput = {}): FrontierCanvasToolMachine {
  const modes = (input.modes ?? []).map(normalizeMode);
  const mode = input.mode ?? modes[0]?.id ?? 'default';
  const activeToolId = input.activeToolId ?? modes.find((entry) => entry.id === mode)?.defaultToolId ?? modes.find((entry) => entry.id === mode)?.toolIds[0] ?? '';
  return {
    kind: FRONTIER_CANVAS_TOOLS_MACHINE_KIND,
    version: FRONTIER_CANVAS_TOOLS_MACHINE_VERSION,
    id: input.id ?? 'canvas-tool-machine',
    mode,
    activeToolId,
    phase: input.phase ?? 'idle',
    stateScope: normalizeToolStateScope(input.stateScope, 'local'),
    modes,
    settingsByTool: normalizeSettingsByTool(input.settingsByTool),
    ...(input.capturedPointerId !== undefined ? { capturedPointerId: input.capturedPointerId } : {}),
    ...(input.capturedGestureId !== undefined ? { capturedGestureId: input.capturedGestureId } : {}),
    ...(input.hoverPreview !== undefined ? { hoverPreview: input.hoverPreview ? normalizeHoverPreview(input.hoverPreview) : null } : {}),
    updatedAt: Date.now(),
    ...optionalObject('metadata', input.metadata)
  };
}

export function listToolsForCanvasMode(machine: FrontierCanvasToolMachine, tools: readonly FrontierCanvasTool[]): FrontierCanvasTool[] {
  const mode = machine.modes.find((entry) => entry.id === machine.mode);
  if (!mode) return tools.slice();
  const allowed = new Set(mode.toolIds);
  return tools.filter((tool) => allowed.has(tool.id));
}

export function setCanvasToolMode(
  machine: FrontierCanvasToolMachine,
  modeId: string,
  options: { path?: string; now?: number } = {}
): FrontierCanvasToolMachineTransition {
  const mode = machine.modes.find((entry) => entry.id === modeId);
  const nextToolId = mode?.defaultToolId ?? mode?.toolIds[0] ?? machine.activeToolId;
  return transitionMachine(machine, {
    ...machine,
    mode: modeId,
    activeToolId: nextToolId,
    phase: 'idle',
    hoverPreview: null,
    updatedAt: options.now ?? Date.now()
  }, options.path, {
    enteredToolId: nextToolId,
    exitedToolId: machine.activeToolId === nextToolId ? undefined : machine.activeToolId
  });
}

export function selectCanvasTool(
  machine: FrontierCanvasToolMachine,
  toolId: string,
  options: { path?: string; now?: number } = {}
): FrontierCanvasToolMachineTransition {
  return transitionMachine(machine, {
    ...machine,
    activeToolId: toolId,
    phase: 'idle',
    hoverPreview: null,
    updatedAt: options.now ?? Date.now()
  }, options.path, {
    enteredToolId: toolId,
    exitedToolId: machine.activeToolId === toolId ? undefined : machine.activeToolId
  });
}

export function setCanvasToolControl(
  machine: FrontierCanvasToolMachine,
  toolId: string,
  controlId: string,
  value: unknown,
  options: { path?: string; now?: number } = {}
): FrontierCanvasToolMachineTransition {
  const settings = { ...(machine.settingsByTool[toolId] ?? {}) };
  settings[controlId] = toJsonValue(value);
  return transitionMachine(machine, {
    ...machine,
    settingsByTool: { ...machine.settingsByTool, [toolId]: settings },
    updatedAt: options.now ?? Date.now()
  }, options.path);
}

export function beginCanvasToolGesture(
  machine: FrontierCanvasToolMachine,
  input: { pointerId?: string | number; gestureId?: string | number; phase?: FrontierCanvasToolPhase; path?: string; now?: number } = {}
): FrontierCanvasToolMachineTransition {
  return transitionMachine(machine, {
    ...machine,
    phase: input.phase ?? 'dragging',
    capturedPointerId: input.pointerId ?? machine.capturedPointerId ?? null,
    capturedGestureId: input.gestureId ?? machine.capturedGestureId ?? null,
    updatedAt: input.now ?? Date.now()
  }, input.path);
}

export function updateCanvasToolGesture(
  machine: FrontierCanvasToolMachine,
  input: { preview?: FrontierCanvasHoverPreviewInput | null; phase?: FrontierCanvasToolPhase; path?: string; now?: number } = {}
): FrontierCanvasToolMachineTransition {
  return transitionMachine(machine, {
    ...machine,
    phase: input.phase ?? machine.phase,
    ...(input.preview !== undefined ? { hoverPreview: input.preview ? normalizeHoverPreview(input.preview) : null } : {}),
    updatedAt: input.now ?? Date.now()
  }, input.path);
}

export function commitCanvasToolGesture(
  machine: FrontierCanvasToolMachine,
  options: { path?: string; now?: number } = {}
): FrontierCanvasToolMachineTransition {
  return transitionMachine(machine, {
    ...machine,
    phase: 'committed',
    capturedPointerId: null,
    capturedGestureId: null,
    hoverPreview: null,
    updatedAt: options.now ?? Date.now()
  }, options.path, { committed: true });
}

export function cancelCanvasToolGesture(
  machine: FrontierCanvasToolMachine,
  options: { path?: string; now?: number } = {}
): FrontierCanvasToolMachineTransition {
  return transitionMachine(machine, {
    ...machine,
    phase: 'cancelled',
    capturedPointerId: null,
    capturedGestureId: null,
    hoverPreview: null,
    updatedAt: options.now ?? Date.now()
  }, options.path, { cancelled: true });
}

export function canUseCanvasTool(
  tool: { id: string; requires: readonly string[] },
  context: FrontierCanvasToolPermissionContext = {}
): FrontierCanvasToolPermissionResult {
  const capabilities = new Set(context.capabilities ?? []);
  const policy = context.policyDecision;
  const missingCapabilities = tool.requires.filter((capability) => !capabilities.has(capability));
  const blockedReasons: string[] = [];
  let allowed = missingCapabilities.length === 0;
  let requiresApproval = false;
  if (policy) {
    if (policy.deniedTools?.includes(tool.id)) {
      allowed = false;
      blockedReasons.push('policy-denied-tool');
    }
    if (policy.allowedTools && !policy.allowedTools.includes(tool.id)) {
      allowed = false;
      blockedReasons.push('policy-tool-not-allowed');
    }
    if (policy.allowed === false || policy.access === 'deny') {
      allowed = false;
      blockedReasons.push('policy-denied');
    }
    requiresApproval = policy.requiresApproval === true || policy.access === 'approval-required';
    if (requiresApproval) blockedReasons.push('policy-requires-approval');
    for (const reason of policy.reasons ?? []) blockedReasons.push(reason);
  }
  for (const capability of missingCapabilities) blockedReasons.push('missing-capability:' + capability);
  return {
    allowed: allowed && !requiresApproval,
    requiresApproval,
    missingCapabilities,
    blockedReasons: uniqueStrings(blockedReasons)
  };
}

export function dispatchCanvasToolWithPermissions<TState = unknown>(
  registry: FrontierCanvasToolRegistry<TState>,
  request: FrontierCanvasToolDispatchRequest<TState>,
  permissionContext: FrontierCanvasToolPermissionContext = {}
): FrontierCanvasToolRecord {
  const toolId = request.toolId ?? registry.activeToolId ?? request.context.session.activeToolId ?? '';
  const tool = registry.get(toolId);
  if (!tool) return dispatchCanvasTool(registry, request);
  const permission = canUseCanvasTool(tool, permissionContext);
  if (!permission.allowed) {
    return createToolRecord({
      toolId,
      eventType: request.event.type,
      status: permission.requiresApproval ? 'blocked:approval-required' : 'blocked',
      createdAt: readNow(request.now),
      reads: tool.reads,
      writes: tool.writes,
      requires: tool.requires,
      message: permission.blockedReasons.join(', '),
      metadata: { permission }
    });
  }
  return dispatchCanvasTool(registry, request);
}

export function defineAsyncCanvasTool<TState = unknown>(input: FrontierCanvasAsyncToolInput<TState>): FrontierCanvasAsyncTool<TState> {
  const syncHandlers: Record<string, () => FrontierCanvasToolResult> = {};
  for (const event of Object.keys(input.handlers)) {
    syncHandlers[event] = () => ({ status: 'async', message: 'use dispatchAsyncCanvasTool for async handlers' });
  }
  const handlers = new Map<string, FrontierCanvasAsyncToolHandler<TState>>();
  for (const [event, handler] of Object.entries(input.handlers)) {
    if (handler) handlers.set(event, handler);
  }
  return {
    tool: defineCanvasTool({ ...input, handlers: syncHandlers }),
    handlers
  };
}

export async function dispatchAsyncCanvasTool<TState = unknown>(
  asyncTool: FrontierCanvasAsyncTool<TState>,
  request: FrontierCanvasToolDispatchRequest<TState>
): Promise<FrontierCanvasToolRecord> {
  const createdAt = readNow(request.now);
  const handler = asyncTool.handlers.get(request.event.type);
  if (!handler) {
    return createToolRecord({
      toolId: asyncTool.tool.id,
      eventType: request.event.type,
      status: 'ignored',
      createdAt,
      reads: asyncTool.tool.reads,
      writes: asyncTool.tool.writes,
      requires: asyncTool.tool.requires,
      message: 'async tool has no handler for event: ' + request.event.type
    });
  }
  try {
    const result = await handler(request.context, request.event) ?? {};
    return createToolRecord({
      toolId: asyncTool.tool.id,
      eventType: request.event.type,
      status: result.status ?? 'ok',
      createdAt,
      patches: result.patches,
      reads: asyncTool.tool.reads,
      writes: asyncTool.tool.writes,
      requires: asyncTool.tool.requires,
      message: result.message,
      metadata: result.metadata
    });
  } catch (error) {
    return createToolRecord({
      toolId: asyncTool.tool.id,
      eventType: request.event.type,
      status: 'error',
      createdAt,
      reads: asyncTool.tool.reads,
      writes: asyncTool.tool.writes,
      requires: asyncTool.tool.requires,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

export function createAsyncCanvasToolTask(input: {
  toolId: string;
  eventType: string;
  status?: FrontierCanvasAsyncToolTaskStatus;
  startedAt?: number;
  endedAt?: number;
  patches?: readonly FrontierCanvasPatchInput[];
  message?: string;
  metadata?: unknown;
}): FrontierCanvasAsyncToolTask {
  const startedAt = input.startedAt ?? Date.now();
  return {
    kind: FRONTIER_CANVAS_ASYNC_TOOL_TASK_KIND,
    version: FRONTIER_CANVAS_ASYNC_TOOL_TASK_VERSION,
    id: 'canvas-async-task:' + stableHash([input.toolId, input.eventType, startedAt, input.status ?? 'pending']),
    toolId: input.toolId,
    eventType: input.eventType,
    status: input.status ?? 'pending',
    startedAt,
    ...(input.endedAt !== undefined ? { endedAt: input.endedAt } : {}),
    patches: (input.patches ?? []).map((patch) => ({ ...patch, path: normalizeFrontierRegistryPath(patch.path) })),
    ...(input.message ? { message: input.message } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

export function createCanvasToolActions(
  tools: readonly FrontierCanvasTool[],
  options: { namespace?: string; route?: string; package?: string; feature?: string; owner?: string } = {}
): FrontierToolActionInput[] {
  const namespace = options.namespace ?? 'canvas';
  return tools.map((tool) => ({
    id: namespace + '.' + tool.id,
    title: tool.title,
    description: tool.description,
    inputSchema: {
      type: 'object',
      properties: {
        event: { type: 'object' },
        settings: { type: 'object' }
      },
      additionalProperties: true
    },
    reads: tool.reads,
    writes: tool.writes,
    requires: tool.requires,
    policyResources: [...tool.reads, ...tool.writes],
    routes: options.route ? [options.route] : [],
    dryRun: true,
    expectedPatch: tool.expectedPatch,
    owner: options.owner,
    package: options.package,
    feature: options.feature,
    tags: ['canvas-tool', ...tool.modes],
    metadata: {
      canvasToolId: tool.id,
      icon: tool.icon ?? null,
      cursor: tool.cursor ?? null,
      events: tool.events,
      controls: tool.controls
    }
  }));
}

export function createCanvasToolsAiManifest(
  input: {
    id?: string;
    title?: string;
    tools: readonly FrontierCanvasTool[];
    namespace?: string;
    route?: string;
    package?: string;
    feature?: string;
    owner?: string;
    metadata?: unknown;
  }
): FrontierToolsManifest {
  return createToolsManifest({
    id: input.id ?? 'canvas-tools',
    title: input.title ?? 'Canvas tools',
    package: input.package,
    feature: input.feature,
    owner: input.owner,
    actions: createCanvasToolActions(input.tools, input),
    metadata: input.metadata
  });
}

function paintPatchesForEvent<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>,
  includePrevious: boolean
): FrontierCanvasPatchInput[] {
  const cells = cellsForPointerStroke(context, event, options, includePrevious);
  return cellWritePatches(cells, paintValueForEvent(context, event, options), { cellsPath: options.cellsPath ?? DEFAULT_CELLS_PATH, op: 'set' });
}

function erasePatchesForEvent<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>,
  includePrevious: boolean
): FrontierCanvasPatchInput[] {
  const cells = cellsForPointerStroke(context, event, options, includePrevious);
  const emptyValue = options.emptyValue;
  if (emptyValue !== undefined) {
    return cellWritePatches(cells, toJsonValue(emptyValue), { cellsPath: options.cellsPath ?? DEFAULT_CELLS_PATH, op: 'set' });
  }
  return cellWritePatches(cells, null, { cellsPath: options.cellsPath ?? DEFAULT_CELLS_PATH, op: 'remove' });
}

function lineCellsForEvent<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>
): FrontierCanvasCell[] {
  const start = cellFromPoint(resolveStartWorld(context, event), options);
  const end = cellFromEvent(context, event, options);
  return start && end ? bresenhamCells(start.x, start.y, end.x, end.y) : [];
}

function rectCellsForEvent<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>
): FrontierCanvasCell[] {
  const start = cellFromPoint(resolveStartWorld(context, event), options);
  const end = cellFromEvent(context, event, options);
  const filled = readControlBoolean(context, event, 'filled', true);
  return start && end ? rectCells(start, end, filled) : [];
}

function previewCellsResult<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>,
  cells: FrontierCanvasCell[],
  kind: string
): FrontierCanvasToolResult {
  const previewPath = options.previewPath === undefined ? DEFAULT_PREVIEW_PATH : options.previewPath;
  if (!previewPath) return { status: 'ignored' };
  return {
    patches: [{ op: 'set', path: previewPath, value: { kind, cells } }]
  };
}

function commitCellsResult<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>,
  cells: FrontierCanvasCell[]
): FrontierCanvasToolResult {
  const previewPath = options.previewPath === undefined ? DEFAULT_PREVIEW_PATH : options.previewPath;
  const patches = cellWritePatches(cells, paintValueForEvent(context, event, options), { cellsPath: options.cellsPath ?? DEFAULT_CELLS_PATH, op: 'set' });
  if (previewPath) patches.push({ op: 'remove', path: previewPath });
  return { patches };
}

function clearPreviewResult(previewPath: string | null | undefined): FrontierCanvasToolResult {
  return previewPath ? { patches: [{ op: 'remove', path: previewPath }] } : { status: 'ignored' };
}

function cellsForPointerStroke<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>,
  includePrevious: boolean
): FrontierCanvasCell[] {
  const end = cellFromEvent(context, event, options);
  if (!end) return [];
  if (!includePrevious) return [end];
  const startWorld = event.previousScreen
    ? screenToWorld(context.camera, context.viewport, event.previousScreen)
    : event.startWorld ?? event.world;
  const start = cellFromPoint(startWorld, options);
  if (!start) return [end];
  return bresenhamCells(start.x, start.y, end.x, end.y);
}

function cellFromEvent<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>
): FrontierCanvasCell | null {
  return cellFromPoint(resolveWorld(context, event), options);
}

function cellFromPoint(point: FrontierCanvasPoint | undefined, options: FrontierCanvasGridToolOptions): FrontierCanvasCell | null {
  if (!point) return null;
  const size = Math.max(0.000001, readFinite(options.cellSize, 1));
  return {
    x: Math.floor(point.x / size),
    y: Math.floor(point.y / size)
  };
}

function resolveWorld<TState>(context: FrontierCanvasToolContext<TState>, event: FrontierCanvasToolEvent): FrontierCanvasPoint | undefined {
  if (event.world) return event.world;
  if (event.screen) return screenToWorld(context.camera, context.viewport, event.screen);
  return undefined;
}

function resolveStartWorld<TState>(context: FrontierCanvasToolContext<TState>, event: FrontierCanvasToolEvent): FrontierCanvasPoint | undefined {
  if (event.startWorld) return event.startWorld;
  if (event.startScreen) return screenToWorld(context.camera, context.viewport, event.startScreen);
  return resolveWorld(context, event);
}

function paintValueForEvent<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasGridToolOptions<TState>
): JsonValue {
  const input = asObject(event.input);
  const base = input.value !== undefined ? input.value : options.value ?? true;
  const flipX = readControlBoolean(context, event, 'flipX', false);
  const flipY = readControlBoolean(context, event, 'flipY', false);
  const value = toJsonValue(base);
  if (!flipX && !flipY) return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...value, ...(flipX ? { flipX: true } : {}), ...(flipY ? { flipY: true } : {}) };
  }
  return { value, ...(flipX ? { flipX: true } : {}), ...(flipY ? { flipY: true } : {}) };
}

function cellWritePatches(
  cells: readonly FrontierCanvasCell[],
  value: JsonValue,
  options: { cellsPath: string; op: FrontierCanvasCellOp }
): FrontierCanvasPatchInput[] {
  const basePath = normalizeFrontierRegistryPath(options.cellsPath);
  const patches: FrontierCanvasPatchInput[] = new Array(cells.length);
  if (options.op === 'set') {
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      patches[index] = { op: 'set', path: basePath + '/' + cell.x + ',' + cell.y, value };
    }
  } else {
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      patches[index] = { op: options.op, path: basePath + '/' + cell.x + ',' + cell.y };
    }
  }
  return patches;
}

function readFillSnapshot<TState>(event: FrontierCanvasToolEvent, context: FrontierCanvasToolContext<TState>): FrontierCanvasFillSnapshot {
  const input = asObject(event.input);
  const metadata = asObject(context.metadata);
  const state = asObject(context.state);
  const rawSnapshot = input.snapshot ?? input.grid ?? metadata.snapshot ?? state.snapshot;
  const snapshot = asObject(rawSnapshot);
  const rawCells = input.cells ?? snapshot.cells ?? metadata.cells ?? state.cells;
  const cells = isCellMap(rawCells) ? rawCells : asJsonRecord(rawCells);
  const bounds = normalizeRectInput(input.bounds ?? snapshot.bounds ?? metadata.bounds);
  return {
    cells,
    ...(bounds ? { bounds } : {})
  };
}

function normalizeCellSnapshot(cells: FrontierCanvasFillCells): FrontierCanvasCellSnapshotIndex {
  if (isCellMap(cells)) {
    return {
      size: cells.size,
      get: (key) => cells.get(key),
      getAt: (x, y) => cells.get(x + ',' + y),
      entries: () => cells.entries(),
      keys: () => cells.keys()
    };
  }
  return {
    get size() {
      return Object.keys(cells).length;
    },
    get: (key) => Object.prototype.hasOwnProperty.call(cells, key) ? cells[key] : undefined,
    getAt: (x, y) => {
      const key = x + ',' + y;
      return Object.prototype.hasOwnProperty.call(cells, key) ? cells[key] : undefined;
    },
    entries: () => Object.entries(cells)[Symbol.iterator](),
    keys: () => Object.keys(cells)[Symbol.iterator]()
  };
}

function readSnapshotCell(cells: FrontierCanvasCellSnapshotIndex, cell: FrontierCanvasCell, emptyValue: JsonValue): JsonValue {
  return readSnapshotCellAt(cells, cell.x, cell.y, emptyValue);
}

function readSnapshotCellAt(cells: FrontierCanvasCellSnapshotIndex, x: number, y: number, emptyValue: JsonValue): JsonValue {
  return cells.getAt(x, y) ?? emptyValue;
}

function enqueueFloodRuns(
  stack: FrontierCanvasCell[],
  cells: FrontierCanvasCellSnapshotIndex,
  visited: Set<string>,
  matchesTarget: (value: JsonValue) => boolean,
  y: number,
  left: number,
  right: number,
  minY: number,
  maxY: number,
  emptyValue: JsonValue
): void {
  if (y < minY || y > maxY) return;
  let inRun = false;
  for (let x = left; x <= right; x++) {
    const key = cellKey(x, y);
    const matches = !visited.has(key) && matchesTarget(readSnapshotCellAt(cells, x, y, emptyValue));
    if (matches && !inRun) {
      stack.push({ x, y });
      inRun = true;
    } else if (!matches) {
      inRun = false;
    }
  }
}

function scanlineFloodFillIndexed(
  cells: FrontierCanvasCellSnapshotIndex,
  start: FrontierCanvasCell,
  matchesTarget: (value: JsonValue) => boolean,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  width: number,
  area: number,
  maxCells: number,
  emptyValue: JsonValue
): FrontierCanvasCell[] {
  const visited = new Uint8Array(area);
  const out: FrontierCanvasCell[] = [];
  const stack: FrontierCanvasCell[] = [start];
  while (stack.length && out.length < maxCells) {
    const seed = stack.pop();
    if (!seed || seed.x < minX || seed.x > maxX || seed.y < minY || seed.y > maxY) continue;
    const rowOffset = (seed.y - minY) * width - minX;
    let left = seed.x;
    while (
      left >= minX &&
      !visited[rowOffset + left] &&
      matchesTarget(readSnapshotCellAt(cells, left, seed.y, emptyValue))
    ) left--;
    left++;
    let right = seed.x;
    while (
      right <= maxX &&
      !visited[rowOffset + right] &&
      matchesTarget(readSnapshotCellAt(cells, right, seed.y, emptyValue))
    ) right++;
    right--;
    if (right < left) continue;
    for (let x = left; x <= right && out.length < maxCells; x++) {
      visited[rowOffset + x] = 1;
      out.push({ x, y: seed.y });
    }
    enqueueFloodRunsIndexed(stack, cells, visited, matchesTarget, seed.y - 1, left, right, minX, minY, maxY, width, emptyValue);
    enqueueFloodRunsIndexed(stack, cells, visited, matchesTarget, seed.y + 1, left, right, minX, minY, maxY, width, emptyValue);
  }
  return out;
}

function enqueueFloodRunsIndexed(
  stack: FrontierCanvasCell[],
  cells: FrontierCanvasCellSnapshotIndex,
  visited: Uint8Array,
  matchesTarget: (value: JsonValue) => boolean,
  y: number,
  left: number,
  right: number,
  minX: number,
  minY: number,
  maxY: number,
  width: number,
  emptyValue: JsonValue
): void {
  if (y < minY || y > maxY) return;
  let inRun = false;
  const rowOffset = (y - minY) * width - minX;
  for (let x = left; x <= right; x++) {
    const index = rowOffset + x;
    const matches = !visited[index] && matchesTarget(readSnapshotCellAt(cells, x, y, emptyValue));
    if (matches && !inRun) {
      stack.push({ x, y });
      inRun = true;
    } else if (!matches) {
      inRun = false;
    }
  }
}

function entityPointFromEvent<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  options: FrontierCanvasEntityBrushOptions<TState>
): FrontierCanvasPoint | null {
  const world = resolveWorld(context, event);
  if (!world) return null;
  const snapX = readControlBoolean(context, event, 'snapX', true);
  const snapY = readControlBoolean(context, event, 'snapY', true);
  const snapGridWidth = Math.max(0.000001, readControlNumber(context, event, 'snapGridWidth', 1));
  const snapGridHeight = Math.max(0.000001, readControlNumber(context, event, 'snapGridHeight', 1));
  return {
    x: snapX ? snapValue(world.x, snapGridWidth) : world.x,
    y: snapY ? snapValue(world.y, snapGridHeight) : world.y
  };
}

function moveItemPatches<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  itemsPath: string
): FrontierCanvasPatchInput[] {
  const input = asObject(event.input);
  const ids = uniqueStrings(readArray(input.ids).map(String).concat(context.session.selectedIds ?? []));
  const startWorld = resolveStartWorld(context, event);
  const world = resolveWorld(context, event);
  if (!ids.length || !startWorld || !world) return [];
  const startItems = normalizeStartItems(input.startItems ?? context.frame);
  const dx = world.x - startWorld.x;
  const dy = world.y - startWorld.y;
  const patches: FrontierCanvasPatchInput[] = [];
  for (const id of ids) {
    const item = startItems.get(id);
    if (!item) continue;
    patches.push({ op: 'set', path: joinPath(itemsPath, id, 'x'), value: item.x + dx });
    patches.push({ op: 'set', path: joinPath(itemsPath, id, 'y'), value: item.y + dy });
  }
  return patches;
}

function resizeItemPatches<TState>(
  event: FrontierCanvasToolEvent,
  itemsPath: string,
  options: FrontierCanvasTransformToolOptions<TState>
): FrontierCanvasPatchInput[] {
  const input = asObject(event.input);
  const item = asRectObject(input.item);
  const id = readString(input.id ?? input.itemId ?? item?.id, '');
  const edge = readString(input.edge ?? input.handle, '');
  const startWorld = asPoint(input.startWorld ?? event.startWorld);
  const world = asPoint(input.world ?? event.world);
  if (!id || !item || !edge || !startWorld || !world) return [];
  const next = resizeRectFromHandle(item, edge, { x: world.x - startWorld.x, y: world.y - startWorld.y }, {
    minWidth: options.minWidth,
    minHeight: options.minHeight
  });
  return [
    { op: 'set', path: joinPath(itemsPath, id, 'x'), value: next.x },
    { op: 'set', path: joinPath(itemsPath, id, 'y'), value: next.y },
    { op: 'set', path: joinPath(itemsPath, id, 'width'), value: next.width },
    { op: 'set', path: joinPath(itemsPath, id, 'height'), value: next.height }
  ];
}

export function resizeRectFromHandle(
  rect: FrontierCanvasRect,
  edge: string,
  delta: FrontierCanvasPoint,
  options: { minWidth?: number; minHeight?: number } = {}
): FrontierCanvasRect {
  let x = rect.x;
  let y = rect.y;
  let width = rect.width;
  let height = rect.height;
  const minWidth = Math.max(0, readFinite(options.minWidth, 0.000001));
  const minHeight = Math.max(0, readFinite(options.minHeight, 0.000001));
  if (edge.includes('w')) {
    x += delta.x;
    width -= delta.x;
  }
  if (edge.includes('e')) width += delta.x;
  if (edge.includes('n')) {
    y += delta.y;
    height -= delta.y;
  }
  if (edge.includes('s')) height += delta.y;
  if (width < minWidth) {
    if (edge.includes('w')) x -= minWidth - width;
    width = minWidth;
  }
  if (height < minHeight) {
    if (edge.includes('n')) y -= minHeight - height;
    height = minHeight;
  }
  return { x, y, width, height };
}

function transitionMachine(
  previous: FrontierCanvasToolMachine,
  machine: FrontierCanvasToolMachine,
  path = DEFAULT_MACHINE_PATH,
  extra: Partial<Omit<FrontierCanvasToolMachineTransition, 'machine' | 'patches'>> = {}
): FrontierCanvasToolMachineTransition {
  return {
    machine,
    patches: [{ op: 'set', path, value: machine as unknown as JsonValue, metadata: { stateScope: machine.stateScope } }],
    ...extra
  };
}

function defaultToolStatePath(rootPath: string, ...segments: readonly string[]): string {
  let out = normalizeFrontierRegistryPath(rootPath);
  for (const segment of segments) out += '/' + escapePathSegment(segment);
  return out;
}

function normalizeToolStateScope(value: unknown, fallback: FrontierCanvasStateScope): FrontierCanvasStateScope {
  return value === 'crdt' || value === 'local' ? value : fallback;
}

function isCanvasToolsStateLayout(value: unknown): value is FrontierCanvasStateLayout {
  return !!value && typeof value === 'object' && (value as FrontierCanvasStateLayout).kind === 'frontier.canvas.state-layout';
}

function normalizeMode(input: FrontierCanvasToolModeInput): FrontierCanvasToolMode {
  return {
    id: input.id,
    ...(input.title ? { title: input.title } : {}),
    toolIds: uniqueStrings(input.toolIds),
    ...(input.defaultToolId ? { defaultToolId: input.defaultToolId } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizeSettingsByTool(input: Record<string, unknown> | undefined): Record<string, JsonObject> {
  const out: Record<string, JsonObject> = {};
  for (const [toolId, settings] of Object.entries(input ?? {})) out[toolId] = asJsonObject(settings);
  return out;
}

function normalizeHoverPreview(input: FrontierCanvasHoverPreviewInput): FrontierCanvasHoverPreview {
  const cells = (input.cells ?? []).map((cell) => ({ x: Math.trunc(cell.x), y: Math.trunc(cell.y) }));
  return {
    id: input.id ?? 'hover:' + stableHash([input.toolId ?? '', cells, input.rect ?? null, input.itemIds ?? []]),
    ...(input.toolId ? { toolId: input.toolId } : {}),
    cells,
    ...(input.rect ? { rect: normalizeRect(input.rect) } : {}),
    itemIds: uniqueStrings(input.itemIds),
    ...optionalObject('metadata', input.metadata)
  };
}

function readControlBoolean<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  id: string,
  fallback: boolean
): boolean {
  const value = readControlValue(context, event, id);
  return value === undefined ? fallback : value === true;
}

function readControlNumber<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  id: string,
  fallback: number
): number {
  const value = readControlValue(context, event, id);
  return readFinite(value, fallback);
}

function readControlValue<TState>(
  context: FrontierCanvasToolContext<TState>,
  event: FrontierCanvasToolEvent,
  id: string
): unknown {
  const input = asObject(event.input);
  const inputSettings = asObject(input.settings);
  if (Object.prototype.hasOwnProperty.call(inputSettings, id)) return inputSettings[id];
  if (Object.prototype.hasOwnProperty.call(input, id)) return input[id];
  const metadata = asObject(context.session.metadata);
  const toolSettings = asObject(metadata.toolSettings);
  const activeSettings = asObject(toolSettings[context.session.activeToolId ?? '']);
  if (Object.prototype.hasOwnProperty.call(activeSettings, id)) return activeSettings[id];
  return undefined;
}

function normalizeStartItems(value: unknown): Map<string, FrontierCanvasRect & { id: string }> {
  const out = new Map<string, FrontierCanvasRect & { id: string }>();
  if (value && typeof value === 'object' && 'items' in value && Array.isArray((value as FrontierCanvasFrame).items)) {
    for (const item of (value as FrontierCanvasFrame).items) out.set(item.id, item);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const rect = asRectObject(item);
      const id = readString(asObject(item).id, '');
      if (rect && id) out.set(id, { ...rect, id });
    }
    return out;
  }
  for (const [id, raw] of Object.entries(asObject(value))) {
    const rect = asRectObject(raw);
    if (rect) out.set(id, { ...rect, id });
  }
  return out;
}

function asRectObject(value: unknown): (FrontierCanvasRect & { id?: string }) | null {
  const object = asObject(value);
  if (!Object.keys(object).length) return null;
  return {
    ...(object.id !== undefined ? { id: String(object.id) } : {}),
    x: readFinite(object.x, 0),
    y: readFinite(object.y, 0),
    width: Math.max(0, readFinite(object.width, 0)),
    height: Math.max(0, readFinite(object.height, 0))
  };
}

function normalizeRectInput(value: unknown): FrontierCanvasRect | undefined {
  const rect = asRectObject(value);
  return rect ? normalizeRect(rect) : undefined;
}

function normalizeRect(rect: FrontierCanvasRect): FrontierCanvasRect {
  return {
    x: readFinite(rect.x, 0),
    y: readFinite(rect.y, 0),
    width: Math.max(0, readFinite(rect.width, 0)),
    height: Math.max(0, readFinite(rect.height, 0))
  };
}

function boundsForSnapshot(cells: FrontierCanvasCellSnapshotIndex): FrontierCanvasRect | null {
  if (!cells.size) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const key of cells.keys()) {
    const cell = cellFromKey(key);
    minX = Math.min(minX, cell.x);
    minY = Math.min(minY, cell.y);
    maxX = Math.max(maxX, cell.x);
    maxY = Math.max(maxY, cell.y);
  }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function asPoint(value: unknown): FrontierCanvasPoint | undefined {
  const object = asObject(value);
  if (!Object.keys(object).length) return undefined;
  return { x: readFinite(object.x, 0), y: readFinite(object.y, 0) };
}

function cellKey(x: number, y: number): string {
  return Math.trunc(x) + ',' + Math.trunc(y);
}

function cellFromKey(key: string): FrontierCanvasCell {
  const index = key.indexOf(',');
  return {
    x: Math.trunc(Number(index >= 0 ? key.slice(0, index) : key) || 0),
    y: Math.trunc(Number(index >= 0 ? key.slice(index + 1) : 0) || 0)
  };
}

function compareCells(left: FrontierCanvasCell, right: FrontierCanvasCell): number {
  return left.y - right.y || left.x - right.x;
}

function snapValue(value: number, gridSize: number): number {
  return Math.floor(value / gridSize) * gridSize;
}

function joinPath(path: string, ...segments: readonly string[]): string {
  let out = normalizeFrontierRegistryPath(path);
  for (const segment of segments) out += '/' + escapePathSegment(segment);
  return out;
}

function escapePathSegment(segment: string): string {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length ? value : fallback;
}

function readFinite(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readNow(now: FrontierCanvasToolDispatchRequest['now']): number {
  return typeof now === 'function' ? now() : now ?? Date.now();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asJsonObject(value: unknown): JsonObject {
  return toJsonValue(asObject(value)) as JsonObject;
}

function asJsonRecord(value: unknown): Record<string, JsonValue> {
  return asObject(value) as Record<string, JsonValue>;
}

function isCellMap(value: unknown): value is ReadonlyMap<string, JsonValue> {
  return value instanceof Map;
}

function optionalObject(key: string, value: unknown): Record<string, JsonObject> {
  if (value === undefined) return {};
  return { [key]: asJsonObject(value) };
}

function toJsonValue(value: unknown): JsonValue {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function createJsonMatcher(target: JsonValue): (value: JsonValue) => boolean {
  if (target === null || typeof target === 'string' || typeof target === 'number' || typeof target === 'boolean') {
    return (value) => Object.is(value, target);
  }
  const targetJson = JSON.stringify(target);
  return (value) => value === target || JSON.stringify(value) === targetJson;
}

function uniqueStrings(values: readonly unknown[] = []): string[] {
  return Array.from(new Set(values.map(String).filter(Boolean))).sort();
}

function createToolRecord(input: {
  toolId: string;
  eventType: string;
  status: string;
  createdAt: number;
  patches?: readonly FrontierCanvasPatchInput[];
  reads?: readonly string[];
  writes?: readonly string[];
  requires?: readonly string[];
  message?: string;
  metadata?: unknown;
}): FrontierCanvasToolRecord {
  return {
    kind: 'frontier.canvas.tool-record',
    version: 1,
    id: 'canvas-tool-record:' + stableHash([input.toolId, input.eventType, input.status, input.createdAt, input.patches ?? []]),
    toolId: input.toolId,
    eventType: input.eventType,
    status: input.status,
    createdAt: input.createdAt,
    patches: (input.patches ?? []).map((patch) => ({
      op: patch.op ?? 'set',
      path: normalizeFrontierRegistryPath(patch.path),
      ...(patch.value !== undefined ? { value: toJsonValue(patch.value) } : {}),
      ...(patch.oldValue !== undefined ? { oldValue: toJsonValue(patch.oldValue) } : {}),
      ...optionalObject('metadata', patch.metadata)
    })),
    plans: [],
    reads: uniqueStrings(input.reads),
    writes: uniqueStrings(input.writes),
    requires: uniqueStrings(input.requires),
    ...(input.message ? { message: input.message } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

function stableHash(value: unknown): string {
  const text = JSON.stringify(value, stableReplacer);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function stableReplacer(_key: string, value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)));
}
