import type { AnimationConfig } from '../types';
import type { PieSlice } from '../render/pie';

export interface PieAnimation {
  start: () => void;
}

export function animatePieSlices(
  slices: PieSlice[],
  config?: AnimationConfig
): PieAnimation {
  const enabled = config?.enabled !== false;
  const duration = config?.duration ?? 600;
  const easing = config?.easing ?? 'ease-out';

  const start = (): void => {
    if (!enabled) return;

    slices.forEach((slice, index) => {
      const path = slice.path;

      // Start with opacity 0 and slightly scaled down
      path.style.opacity = '0';
      path.style.transform = 'scale(0.8)';
      path.style.transformOrigin = 'center';

      // Trigger reflow
      path.getBoundingClientRect();

      // Stagger animation
      const delay = (index / slices.length) * (duration * 0.5);

      path.style.transition = `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`;
      path.style.opacity = '1';
      path.style.transform = 'scale(1)';
    });
  };

  return { start };
}
