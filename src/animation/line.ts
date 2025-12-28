import type { AnimationConfig } from '../types';

export interface LineAnimation {
  start: () => void;
}

export function animateLine(
  linePath: SVGPathElement,
  config?: AnimationConfig
): LineAnimation {
  const enabled = config?.enabled !== false;
  const duration = config?.duration ?? 600;
  const easing = config?.easing ?? 'ease-out';

  const start = (): void => {
    if (!enabled) return;

    // Get the total length of the path
    const length = linePath.getTotalLength();

    // Set up initial state (line is hidden)
    linePath.style.strokeDasharray = String(length);
    linePath.style.strokeDashoffset = String(length);

    // Trigger reflow to ensure initial state is applied
    linePath.getBoundingClientRect();

    // Animate to visible state
    linePath.style.transition = `stroke-dashoffset ${duration}ms ${easing}`;
    linePath.style.strokeDashoffset = '0';
  };

  return { start };
}

export function animateArea(
  areaPath: SVGPathElement,
  config?: AnimationConfig
): LineAnimation {
  const enabled = config?.enabled !== false;
  const duration = config?.duration ?? 600;
  const easing = config?.easing ?? 'ease-out';

  const start = (): void => {
    if (!enabled) return;

    // Fade in the area
    areaPath.style.opacity = '0';

    // Trigger reflow
    areaPath.getBoundingClientRect();

    // Animate opacity
    areaPath.style.transition = `opacity ${duration}ms ${easing}`;
    areaPath.style.opacity = '1';
  };

  return { start };
}

export function animatePoints(
  points: SVGCircleElement[],
  config?: AnimationConfig
): LineAnimation {
  const enabled = config?.enabled !== false;
  const duration = config?.duration ?? 600;
  const easing = config?.easing ?? 'ease-out';

  const start = (): void => {
    if (!enabled) return;

    points.forEach((point, index) => {
      // Start invisible and scaled down
      point.style.opacity = '0';
      point.style.transform = 'scale(0)';
      point.style.transformOrigin = 'center';

      // Trigger reflow
      point.getBoundingClientRect();

      // Stagger the animation
      const delay = (index / points.length) * (duration * 0.5);

      point.style.transition = `opacity ${duration * 0.5}ms ${easing} ${delay}ms, transform ${duration * 0.5}ms ${easing} ${delay}ms`;
      point.style.opacity = '1';
      point.style.transform = 'scale(1)';
    });
  };

  return { start };
}
