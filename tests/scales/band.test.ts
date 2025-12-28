import { describe, it, expect } from 'vitest';
import { createBandScale } from '../../src/scales/band';

describe('createBandScale', () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun'];

  it('maps categories to positions', () => {
    const scale = createBandScale(months, [0, 500]);

    expect(scale('Jan')).toBe(0);
    expect(scale('Jun')).toBe(500);
  });

  it('positions middle categories correctly', () => {
    const scale = createBandScale(months, [0, 500]);

    // 6 categories, so positions are 0, 100, 200, 300, 400, 500
    expect(scale('Feb')).toBe(100);
    expect(scale('Mar')).toBe(200);
    expect(scale('Apr')).toBe(300);
    expect(scale('Maj')).toBe(400);
  });

  it('returns undefined for unknown categories', () => {
    const scale = createBandScale(months, [0, 500]);
    expect(scale('Dec')).toBeUndefined();
  });

  it('returns domain', () => {
    const scale = createBandScale(months, [0, 500]);
    expect(scale.domain()).toEqual(months);
  });

  it('returns range', () => {
    const scale = createBandScale(months, [0, 500]);
    expect(scale.range()).toEqual([0, 500]);
  });

  it('calculates bandwidth', () => {
    const scale = createBandScale(months, [0, 500]);
    expect(scale.bandwidth()).toBe(100);
  });

  it('handles single category', () => {
    const scale = createBandScale(['Jan'], [0, 500]);
    expect(scale('Jan')).toBe(250); // Center of range
    expect(scale.bandwidth()).toBe(500);
  });

  it('handles offset range', () => {
    const scale = createBandScale(months, [50, 550]);

    expect(scale('Jan')).toBe(50);
    expect(scale('Jun')).toBe(550);
  });
});
