import { describe, it, expect } from 'vitest';
import { monotoneCurve } from '../../src/curves/monotone';

describe('monotoneCurve', () => {
  it('returns empty string for empty array', () => {
    expect(monotoneCurve([])).toBe('');
  });

  it('returns move command for single point', () => {
    const result = monotoneCurve([{ x: 100, y: 200 }]);
    expect(result).toBe('M 100,200');
  });

  it('returns line for two points', () => {
    const result = monotoneCurve([
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(result).toBe('M 0,0 L 100,100');
  });

  it('generates cubic bezier path for multiple points', () => {
    const result = monotoneCurve([
      { x: 0, y: 100 },
      { x: 50, y: 50 },
      { x: 100, y: 100 },
    ]);

    expect(result).toMatch(/^M 0,100 C /);
    expect(result).toContain('100,100');
    expect((result.match(/C /g) || []).length).toBe(2);
  });

  it('handles horizontal segments', () => {
    const result = monotoneCurve([
      { x: 0, y: 100 },
      { x: 50, y: 100 },
      { x: 100, y: 100 },
    ]);

    expect(result).toMatch(/^M 0,100/);
    expect(result).toContain('100,100');
  });

  it('produces valid path for chart-like data', () => {
    const points = [
      { x: 60, y: 280 },
      { x: 170, y: 240 },
      { x: 280, y: 100 },
      { x: 390, y: 280 },
      { x: 500, y: 80 },
      { x: 610, y: 270 },
    ];

    const result = monotoneCurve(points);

    // Should start with move to first point
    expect(result).toMatch(/^M 60,280/);

    // Should have 5 cubic bezier curves (n-1 for n points)
    expect((result.match(/C /g) || []).length).toBe(5);

    // Should end at last point
    expect(result).toContain('610,270');
  });
});
