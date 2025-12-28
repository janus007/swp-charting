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
  width: number;
  label?: string;
  color?: string;
  fontSize?: number;
}

export interface RightYAxisOptions {
  scale: LinearScale;
  width: number;
  padding: ResolvedPadding;
  format?: (value: number) => string;
  color?: string;
  fontSize?: number;
}

export function renderRightYAxis(options: RightYAxisOptions): SVGTextElement[] {
  const {
    scale,
    width,
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
    const label = createText(width - padding.right + 15, y + 4, formatFn(tick), {
      'text-anchor': 'start',
      'font-size': fontSize,
      fill: color,
    });
    labels.push(label);
  }

  return labels;
}

export function renderXAxis(options: XAxisOptions): SVGTextElement[] {
  const {
    scale,
    height,
    padding,
    width,
    label,
    color = '#999',
    fontSize = 12,
  } = options;

  const categories = scale.domain();
  const labels: SVGTextElement[] = [];

  // X-value labels position (just below chart area)
  const xLabelY = label
    ? height - 27  // When there's a label below, leave room for it
    : height - padding.bottom + 18;

  for (const category of categories) {
    const x = scale(category);
    if (x === undefined) continue;

    const categoryLabel = createText(x, xLabelY, category, {
      'text-anchor': 'middle',
      'font-size': fontSize,
      fill: color,
    });
    labels.push(categoryLabel);
  }

  // Add centered x-axis label if provided
  if (label) {
    const centerX = padding.left + (width - padding.left - padding.right) / 2;
    const axisLabel = createText(centerX, height - 5, label, {
      'text-anchor': 'middle',
      'font-size': fontSize + 2,
      'font-weight': 'bold',
      fill: color,
    });
    labels.push(axisLabel);
  }

  return labels;
}
