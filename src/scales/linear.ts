export interface LinearScale {
  (value: number): number;
  domain: () => [number, number];
  range: () => [number, number];
  ticks: (count?: number) => number[];
}

export function createLinearScale(
  domain: [number, number],
  range: [number, number]
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const domainSpan = d1 - d0;
  const rangeSpan = r1 - r0;

  const scale = (value: number): number => {
    if (domainSpan === 0) return r0;
    return r0 + ((value - d0) / domainSpan) * rangeSpan;
  };

  scale.domain = () => domain;
  scale.range = () => range;

  scale.ticks = (count = 5): number[] => {
    if (count < 2) count = 2;

    const step = niceStep(domainSpan / (count - 1));
    const start = Math.ceil(d0 / step) * step;
    const end = Math.floor(d1 / step) * step;

    const ticks: number[] = [];
    for (let t = start; t <= end + step * 0.5; t += step) {
      ticks.push(Math.round(t * 1e10) / 1e10); // Avoid floating point issues
    }
    return ticks;
  };

  return scale;
}

function niceStep(rawStep: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;

  return nice * magnitude;
}
