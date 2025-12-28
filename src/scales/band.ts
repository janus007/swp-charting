export interface BandScale {
  (category: string): number | undefined;
  domain: () => string[];
  range: () => [number, number];
  bandwidth: () => number;
}

export interface BandScaleOptions {
  /** Inner padding as fraction of bandwidth (0-1), default 0 */
  paddingInner?: number;
  /** Outer padding in pixels, default 0 */
  paddingOuter?: number;
}

export function createBandScale(
  domain: string[],
  range: [number, number],
  options?: BandScaleOptions
): BandScale {
  const [r0, r1] = range;
  const n = domain.length;
  const paddingOuter = options?.paddingOuter ?? 0;

  // Adjust range for outer padding
  const adjustedR0 = r0 + paddingOuter;
  const adjustedR1 = r1 - paddingOuter;
  const adjustedSpan = adjustedR1 - adjustedR0;

  // Create a map for O(1) lookup
  const indexMap = new Map<string, number>();
  domain.forEach((cat, i) => indexMap.set(cat, i));

  const scale = (category: string): number | undefined => {
    const index = indexMap.get(category);
    if (index === undefined) return undefined;

    // Position at the center of each band
    if (n <= 1) return adjustedR0 + adjustedSpan / 2;
    return adjustedR0 + (index / (n - 1)) * adjustedSpan;
  };

  scale.domain = () => [...domain];
  scale.range = () => range;

  scale.bandwidth = (): number => {
    if (n <= 1) return adjustedSpan;
    return adjustedSpan / (n - 1);
  };

  return scale;
}
