import type { Point } from '../types';

/**
 * Generates a linear (straight line) path between points.
 */
export function linearCurve(points: Point[]): string {
  if (points.length === 0) return '';

  const first = points[0]!;
  if (points.length === 1) return `M ${first.x},${first.y}`;

  let path = `M ${first.x},${first.y}`;

  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    path += ` L ${p.x},${p.y}`;
  }

  return path;
}
