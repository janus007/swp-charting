import { createText } from './svg';
import type { LinearScale } from '../scales/linear';
import type { BandScale } from '../scales/band';
import type { ResolvedPadding } from '../types';

export interface YAxisOptions {
  scale: LinearScale;
  padding: ResolvedPadding;
  format?: (value: number) => string;
  color?: string;
  fontSize?: number;
}

export function renderYAxis(options: YAxisOptions): SVGTextElement[] {
  const {
    scale,
    padding,
    format,
    color = '#999',
    fontSize = 12,
  } = options;

  const formatFn = format ?? ((v: number) => String(v));
  const ticks = scale.ticks();
  const labels: SVGTextElement[] = [];

  for (const tick of ticks) {
    const y = scale(tick);
    const label = createText(padding.left - 15, y + 4, formatFn(tick), {
      'text-anchor': 'end',
      'font-size': fontSize,
      fill: color,
    });
    labels.push(label);
  }

  return labels;
}

export interface XAxisOptions {
  scale: BandScale;
  height: number;
  padding: ResolvedPadding;
  color?: string;
  fontSize?: number;
}

export function renderXAxis(options: XAxisOptions): SVGTextElement[] {
  const {
    scale,
    height,
    padding,
    color = '#999',
    fontSize = 12,
  } = options;

  const categories = scale.domain();
  const labels: SVGTextElement[] = [];

  for (const category of categories) {
    const x = scale(category);
    if (x === undefined) continue;

    const label = createText(x, height - padding.bottom + 18, category, {
      'text-anchor': 'middle',
      'font-size': fontSize,
      fill: color,
    });
    labels.push(label);
  }

  return labels;
}
