import { createSvgElement, createGradient } from './svg';
import type { ComputedPoint, SeriesConfig, BarStyle, ResolvedPadding } from '../types';

export interface BarRenderOptions {
  series: SeriesConfig;
  computedPoints: ComputedPoint[];
  padding: ResolvedPadding;
  chartHeight: number;
  seriesIndex: number;
  seriesCount: number;
  bandwidth: number;
}

export interface BarRenderResult {
  barRects: SVGRectElement[];
  gradient?: SVGLinearGradientElement;
}

export function renderBar(options: BarRenderOptions): BarRenderResult {
  const {
    series,
    computedPoints,
    padding,
    chartHeight,
    seriesIndex,
    seriesCount,
    bandwidth,
  } = options;

  if (computedPoints.length === 0) {
    return { barRects: [] };
  }

  const barStyle = series.bar;
  const baseline = padding.top + chartHeight;

  // Calculate bar dimensions
  const defaultBarWidth = 20;
  const barWidth = barStyle?.width === 'auto'
    ? (bandwidth * 0.8) / seriesCount
    : barStyle?.width ?? defaultBarWidth;

  const gap = seriesCount > 1 ? 4 : 0; // Small gap between grouped bars
  const actualBarWidth = barWidth;
  const groupWidth = (barWidth + gap) * seriesCount - gap;

  // Calculate offset for grouped bars
  const groupOffset = -groupWidth / 2;
  const barOffset = groupOffset + seriesIndex * (barWidth + gap);

  const radius = barStyle?.radius ?? 0;
  const opacity = barStyle?.opacity ?? 1;

  // Create gradient if needed
  let gradient: SVGLinearGradientElement | undefined;
  const gradientId = `bar-gradient-${seriesIndex}`;

  if (series.area?.gradient !== false) {
    gradient = createGradient(
      gradientId,
      series.color,
      0.9,
      0.7,
      '0%',
      '100%'
    );
  }

  // Create bars
  const barRects: SVGRectElement[] = [];

  for (const point of computedPoints) {
    const barHeight = baseline - point.y;
    if (barHeight <= 0) continue;

    const x = point.x + barOffset;
    const y = point.y;

    const rect = createSvgElement('rect', {
      x,
      y,
      width: actualBarWidth,
      height: barHeight,
      rx: radius,
      ry: radius,
      fill: gradient ? `url(#${gradientId})` : series.color,
      opacity,
    });

    // Store data for hover
    rect.dataset['dataX'] = point.dataX;
    rect.dataset['dataY'] = String(point.dataY);

    barRects.push(rect);
  }

  if (gradient) {
    return { barRects, gradient };
  }
  return { barRects };
}

export function getBarWidth(
  bandwidth: number,
  seriesCount: number,
  barStyle?: BarStyle
): number {
  if (barStyle?.width === 'auto') {
    return (bandwidth * 0.8) / seriesCount;
  }
  return barStyle?.width ?? 20;
}
