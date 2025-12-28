import { describe, it, expect } from 'vitest';
import { createLinearScale } from '../../src/scales/linear';

describe('createLinearScale', () => {
  it('maps domain values to range values', () => {
    const scale = createLinearScale([0, 100], [0, 500]);

    expect(scale(0)).toBe(0);
    expect(scale(50)).toBe(250);
    expect(scale(100)).toBe(500);
  });

  it('handles inverted ranges', () => {
    const scale = createLinearScale([0, 100], [500, 0]);

    expect(scale(0)).toBe(500);
    expect(scale(50)).toBe(250);
    expect(scale(100)).toBe(0);
  });

  it('handles non-zero domain start', () => {
    const scale = createLinearScale([200, 1000], [0, 400]);

    expect(scale(200)).toBe(0);
    expect(scale(600)).toBe(200);
    expect(scale(1000)).toBe(400);
  });

  it('returns domain', () => {
    const scale = createLinearScale([0, 100], [0, 500]);
    expect(scale.domain()).toEqual([0, 100]);
  });

  it('returns range', () => {
    const scale = createLinearScale([0, 100], [0, 500]);
    expect(scale.range()).toEqual([0, 500]);
  });

  it('generates nice ticks', () => {
    const scale = createLinearScale([0, 1000], [0, 500]);
    const ticks = scale.ticks(5);

    expect(ticks).toContain(0);
    expect(ticks).toContain(1000);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
  });

  it('generates ticks for arbitrary domain', () => {
    const scale = createLinearScale([0, 920], [0, 300]);
    const ticks = scale.ticks(5);

    expect(ticks[0]).toBe(0);
    expect(ticks.every((t) => t >= 0 && t <= 1000)).toBe(true);
  });

  it('handles zero domain span', () => {
    const scale = createLinearScale([50, 50], [0, 500]);
    expect(scale(50)).toBe(0);
  });
});
