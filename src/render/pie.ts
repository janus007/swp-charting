import { createSvgElement } from './svg';
import type { SeriesConfig, PieStyle } from '../types';

export interface PieSliceBreakdown {
  label: string;
  value: number;
}

export interface PieSlice {
  path: SVGPathElement;
  seriesIndex: number;
  name: string;
  value: number;
  percent: number;
  color: string;
  unit?: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  breakdown?: PieSliceBreakdown[];
}

export interface PieRenderOptions {
  series: SeriesConfig[];
  centerX: number;
  centerY: number;
  outerRadius: number;
  pieStyle?: PieStyle;
}

export interface PieRenderResult {
  slices: PieSlice[];
  total: number;
}

export function renderPie(options: PieRenderOptions): PieRenderResult {
  const { series, centerX, centerY, outerRadius, pieStyle } = options;

  const innerRadius = pieStyle?.innerRadius ?? 0;
  const padAngle = (pieStyle?.padAngle ?? 0) * (Math.PI / 180); // Convert to radians

  // Calculate total value (sum all data points in each series)
  let total = 0;
  for (const s of series) {
    if (s.type === 'pie') {
      for (const point of s.data) {
        total += point.y;
      }
    }
  }

  if (total === 0) {
    return { slices: [], total: 0 };
  }

  const slices: PieSlice[] = [];
  let currentAngle = -Math.PI / 2; // Start at top (12 o'clock)

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    if (!s || s.type !== 'pie' || s.data.length === 0) continue;

    // Sum all data points for this slice
    const value = s.data.reduce((sum, point) => sum + point.y, 0);
    const percent = (value / total) * 100;
    const sliceAngle = (value / total) * 2 * Math.PI;

    // Create breakdown if multiple data points
    const breakdown: PieSliceBreakdown[] | undefined = s.data.length > 1
      ? s.data.map(point => ({ label: point.x, value: point.y }))
      : undefined;

    const startAngle = currentAngle + padAngle / 2;
    const endAngle = currentAngle + sliceAngle - padAngle / 2;
    const midAngle = (startAngle + endAngle) / 2;

    // Create path
    const path = createArcPath(
      centerX,
      centerY,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle
    );

    const pathElement = createSvgElement('path', {
      d: path,
      fill: s.color,
      stroke: '#fff',
      'stroke-width': 2,
      style: 'cursor: pointer; transition: transform 0.2s ease-out;',
    });

    // Store data for hover
    pathElement.dataset['seriesIndex'] = String(i);
    pathElement.dataset['value'] = String(value);
    pathElement.dataset['percent'] = String(percent.toFixed(1));
    pathElement.dataset['name'] = s.name;

    slices.push({
      path: pathElement,
      seriesIndex: i,
      name: s.name,
      value,
      percent,
      color: s.color,
      startAngle,
      endAngle,
      midAngle,
      ...(s.unit && { unit: s.unit }),
      ...(breakdown && { breakdown }),
    });

    currentAngle += sliceAngle;
  }

  return { slices, total };
}

function createArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerRadius === 0) {
    // Pie slice (triangle to center)
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${cx} ${cy}`,
      'Z',
    ].join(' ');
  } else {
    // Donut slice (arc with hole)
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export function getSliceTransform(
  midAngle: number,
  offset: number
): string {
  const dx = Math.cos(midAngle) * offset;
  const dy = Math.sin(midAngle) * offset;
  return `translate(${dx}, ${dy})`;
}
