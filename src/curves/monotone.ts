import type { Point } from '../types';

/**
 * Generates a monotone cubic spline path using the Fritsch-Carlson method.
 * This ensures no overshoot at local extrema.
 */
export function monotoneCurve(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0]!;
    return `M ${p.x},${p.y}`;
  }
  if (points.length === 2) {
    const p0 = points[0]!;
    const p1 = points[1]!;
    return `M ${p0.x},${p0.y} L ${p1.x},${p1.y}`;
  }

  const n = points.length;

  // Calculate slopes between consecutive points
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const curr = points[i]!;
    const next = points[i + 1]!;
    dx[i] = next.x - curr.x;
    dy[i] = next.y - curr.y;
    m[i] = dx[i] === 0 ? 0 : dy[i]! / dx[i]!;
  }

  // Calculate tangents with monotonicity constraint
  const tangents: number[] = new Array(n);
  tangents[0] = m[0]!;
  tangents[n - 1] = m[n - 2]!;

  for (let i = 1; i < n - 1; i++) {
    const mPrev = m[i - 1]!;
    const mCurr = m[i]!;

    if (mPrev * mCurr <= 0) {
      // Local extremum - tangent should be 0
      tangents[i] = 0;
    } else {
      // Average of adjacent slopes
      tangents[i] = (mPrev + mCurr) / 2;

      // Clamp to ensure no overshoot (Fritsch-Carlson)
      const maxSlope = 3 * Math.min(Math.abs(mPrev), Math.abs(mCurr));
      const t = tangents[i]!;
      if (Math.abs(t) > maxSlope) {
        tangents[i] = Math.sign(t) * maxSlope;
      }
    }
  }

  // Build the SVG path
  const firstPoint = points[0]!;
  let path = `M ${firstPoint.x},${firstPoint.y}`;

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const segDx = dx[i]! / 3;

    const cp1x = p0.x + segDx;
    const cp1y = p0.y + segDx * tangents[i]!;
    const cp2x = p1.x - segDx;
    const cp2y = p1.y - segDx * tangents[i + 1]!;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
  }

  return path;
}
