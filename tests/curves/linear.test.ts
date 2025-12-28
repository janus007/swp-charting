import { describe, it, expect } from 'vitest';
import { linearCurve } from '../../src/curves/linear';

describe('linearCurve', () => {
  it('returns empty string for empty array', () => {
    expect(linearCurve([])).toBe('');
  });

  it('returns move command for single point', () => {
    const result = linearCurve([{ x: 100, y: 200 }]);
    expect(result).toBe('M 100,200');
  });

  it('returns line path for two points', () => {
    const result = linearCurve([
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(result).toBe('M 0,0 L 100,100');
  });

  it('generates straight line path for multiple points', () => {
    const result = linearCurve([
      { x: 0, y: 100 },
      { x: 50, y: 50 },
      { x: 100, y: 75 },
      { x: 150, y: 25 },
    ]);

    expect(result).toBe('M 0,100 L 50,50 L 100,75 L 150,25');
  });

  it('produces valid path for chart-like data', () => {
    const points = [
      { x: 60, y: 280 },
      { x: 170, y: 240 },
      { x: 280, y: 100 },
    ];

    const result = linearCurve(points);

    expect(result).toBe('M 60,280 L 170,240 L 280,100');
  });
});
