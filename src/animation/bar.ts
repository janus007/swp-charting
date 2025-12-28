import type { AnimationConfig } from '../types';

export interface BarAnimation {
  start: () => void;
}

export function animateBars(
  barRects: SVGRectElement[],
  baseline: number,
  config?: AnimationConfig
): BarAnimation {
  const enabled = config?.enabled !== false;
  const duration = config?.duration ?? 600;
  const easing = config?.easing ?? 'ease-out';

  const start = (): void => {
    if (!enabled) return;

    barRects.forEach((rect, index) => {
      const finalHeight = parseFloat(rect.getAttribute('height') ?? '0');
      const finalY = parseFloat(rect.getAttribute('y') ?? '0');

      // Start from baseline with zero height
      rect.setAttribute('height', '0');
      rect.setAttribute('y', String(baseline));

      // Trigger reflow
      rect.getBoundingClientRect();

      // Stagger animation
      const delay = (index / barRects.length) * (duration * 0.3);

      rect.style.transition = `height ${duration}ms ${easing} ${delay}ms, y ${duration}ms ${easing} ${delay}ms`;
      rect.setAttribute('height', String(finalHeight));
      rect.setAttribute('y', String(finalY));
    });
  };

  return { start };
}
