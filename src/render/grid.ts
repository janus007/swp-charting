import { createLine } from './svg';
import type { LinearScale } from '../scales/linear';
import type { ResolvedPadding } from '../types';

export interface GridOptions {
  scale: LinearScale;
  width: number;
  padding: ResolvedPadding;
  color?: string;
  strokeWidth?: number;
}

export function renderGrid(options: GridOptions): SVGLineElement[] {
  const {
    scale,
    width,
    padding,
    color = '#f0f0f0',
    strokeWidth = 1,
  } = options;

  const ticks = scale.ticks();
  const lines: SVGLineElement[] = [];

  for (const tick of ticks) {
    const y = scale(tick);
    const line = createLine(padding.left, y, width - padding.right, y, {
      stroke: color,
      'stroke-width': strokeWidth,
    });
    lines.push(line);
  }

  return lines;
}
