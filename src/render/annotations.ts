import { createLine, createRect, createText } from './svg';
import type { BandScale } from '../scales/band';
import type { AnnotationConfig, ResolvedPadding } from '../types';

export interface AnnotationRenderOptions {
  annotations: AnnotationConfig[];
  xScale: BandScale;
  height: number;
  padding: ResolvedPadding;
  categories: string[];
}

export interface AnnotationElements {
  lines: SVGLineElement[];
  regions: SVGRectElement[];
  labels: SVGTextElement[];
}

/**
 * Helper to resolve x position from category name or index
 */
function resolveXPosition(
  x: string | number,
  xScale: BandScale,
  categories: string[]
): number | undefined {
  if (typeof x === 'number') {
    const category = categories[x];
    return category !== undefined ? xScale(category) : undefined;
  }
  return xScale(x);
}

export function renderAnnotations(
  options: AnnotationRenderOptions
): AnnotationElements {
  const { annotations, xScale, height, padding, categories } = options;

  const lines: SVGLineElement[] = [];
  const regions: SVGRectElement[] = [];
  const labels: SVGTextElement[] = [];

  const chartTop = padding.top;
  const chartBottom = height - padding.bottom;
  const chartHeight = chartBottom - chartTop;

  for (const annotation of annotations) {
    const color = annotation.color ?? '#666';
    const lineWidth = annotation.width ?? 1.5;

    if (annotation.type === 'verticalLine') {
      const x = resolveXPosition(annotation.x, xScale, categories);
      if (x === undefined) continue;

      // Create vertical line
      const lineAttrs: Record<string, string | number> = {
        stroke: color,
        'stroke-width': lineWidth,
      };

      if (annotation.dashArray) {
        lineAttrs['stroke-dasharray'] = annotation.dashArray;
      }

      const line = createLine(x, chartTop, x, chartBottom, lineAttrs);
      lines.push(line);

      // Create label if specified
      if (annotation.label) {
        const labelY =
          annotation.labelPosition === 'bottom'
            ? chartBottom + 15
            : chartTop - 8;

        const label = createText(x, labelY, annotation.label, {
          'text-anchor': 'middle',
          'font-size': 11,
          'font-weight': 500,
          fill: color,
        });
        labels.push(label);
      }
    } else if (annotation.type === 'region') {
      const x1 = resolveXPosition(annotation.x, xScale, categories);
      const x2 = annotation.x2 !== undefined
        ? resolveXPosition(annotation.x2, xScale, categories)
        : undefined;

      if (x1 === undefined) continue;

      // If x2 not specified, create a single-width region (like a thick vertical line)
      const regionX = x2 !== undefined ? Math.min(x1, x2) : x1 - lineWidth / 2;
      const regionWidth = x2 !== undefined ? Math.abs(x2 - x1) : lineWidth;

      const rectAttrs: Record<string, string | number> = {};

      if (annotation.backgroundColor) {
        rectAttrs.fill = annotation.backgroundColor;
      } else {
        rectAttrs.fill = 'transparent';
      }

      if (annotation.color) {
        rectAttrs.stroke = color;
        rectAttrs['stroke-width'] = lineWidth;
        if (annotation.dashArray) {
          rectAttrs['stroke-dasharray'] = annotation.dashArray;
        }
      }

      const region = createRect(regionX, chartTop, regionWidth, chartHeight, rectAttrs);
      regions.push(region);

      // Create label if specified (centered in region)
      if (annotation.label) {
        const labelX = regionX + regionWidth / 2;
        const labelY =
          annotation.labelPosition === 'bottom'
            ? chartBottom + 15
            : chartTop - 8;

        const label = createText(labelX, labelY, annotation.label, {
          'text-anchor': 'middle',
          'font-size': 11,
          'font-weight': 500,
          fill: color,
        });
        labels.push(label);
      }
    }
  }

  return { lines, regions, labels };
}
