import { createLine, createText } from './svg';
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
  labels: SVGTextElement[];
}

export function renderAnnotations(
  options: AnnotationRenderOptions
): AnnotationElements {
  const { annotations, xScale, height, padding, categories } = options;

  const lines: SVGLineElement[] = [];
  const labels: SVGTextElement[] = [];

  for (const annotation of annotations) {
    if (annotation.type === 'verticalLine') {
      // Find x position
      let x: number | undefined;

      if (typeof annotation.x === 'number') {
        // x is an index - find the category at that index
        const category = categories[annotation.x];
        if (category !== undefined) {
          x = xScale(category);
        }
      } else {
        // x is a category name
        x = xScale(annotation.x);
      }

      if (x === undefined) continue;

      const color = annotation.color ?? '#666';
      const lineY1 = padding.top;
      const lineY2 = height - padding.bottom;

      // Create vertical line
      const lineAttrs: Record<string, string | number> = {
        stroke: color,
        'stroke-width': 1.5,
      };

      if (annotation.dashArray) {
        lineAttrs['stroke-dasharray'] = annotation.dashArray;
      }

      const line = createLine(x, lineY1, x, lineY2, lineAttrs);
      lines.push(line);

      // Create label if specified
      if (annotation.label) {
        const labelY =
          annotation.labelPosition === 'bottom'
            ? lineY2 + 15
            : lineY1 - 8;

        const label = createText(x, labelY, annotation.label, {
          'text-anchor': 'middle',
          'font-size': 11,
          'font-weight': 500,
          fill: color,
        });
        labels.push(label);
      }
    }
  }

  return { lines, labels };
}
