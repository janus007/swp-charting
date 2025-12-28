import type { TooltipConfig, TooltipData, TooltipAnimation } from '../types';

export interface TooltipElement {
  element: HTMLDivElement;
  show: (x: number, y: number, data: TooltipData) => void;
  hide: () => void;
  destroy: () => void;
}

export function createTooltip(
  container: HTMLElement,
  config?: TooltipConfig
): TooltipElement {
  const animation = config?.animation;
  const customRender = config?.render;
  const fontSize = config?.fontSize ?? 12;

  const element = document.createElement('div');
  element.className = 'swp-chart-tooltip';

  // Apply styles
  Object.assign(element.style, {
    position: 'absolute',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: `${fontSize}px`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    pointerEvents: 'none',
    opacity: '0',
    transition: buildTransition(animation),
    zIndex: '1000',
  });

  container.appendChild(element);

  const show = (x: number, y: number, data: TooltipData): void => {
    if (customRender) {
      element.innerHTML = customRender(data);
    } else {
      element.innerHTML = renderDefaultContent(data, fontSize);
    }

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.opacity = '1';
  };

  const hide = (): void => {
    element.style.opacity = '0';
  };

  const destroy = (): void => {
    element.remove();
  };

  return { element, show, hide, destroy };
}

function buildTransition(animation?: TooltipAnimation): string {
  const duration = animation?.duration ?? 150;
  const easing = animation?.easing ?? 'ease-out';

  return `left ${duration}ms ${easing}, top ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
}

function renderDefaultContent(data: TooltipData, fontSize: number): string {
  const header = `<div style="font-weight: 600; margin-bottom: 4px">${data.x}</div>`;

  const values = data.values
    .map((v) => {
      const unit = v.unit ? ` ${v.unit}` : '';

      // Check if there's breakdown data
      if (v.breakdown && v.breakdown.length > 0) {
        // Show total with percent, then breakdown items
        const totalText = v.percent !== undefined
          ? `${v.value}${unit} (${v.percent.toFixed(1)}%)`
          : `${v.value}${unit}`;
        const totalLine = `<div style="color: ${v.color}; font-weight: 500">${totalText}</div>`;

        const breakdownLines = v.breakdown
          .map((b) => `<div style="color: #555; margin-left: 8px; font-size: ${fontSize}px">${b.label}: ${b.value}${unit}</div>`)
          .join('');

        return totalLine + breakdownLines;
      } else {
        // Standard display (no breakdown)
        const valueText = v.percent !== undefined
          ? `${v.value}${unit} (${v.percent.toFixed(1)}%)`
          : `${v.value}${unit}`;
        return `<div style="color: ${v.color}">${v.name}: ${valueText}</div>`;
      }
    })
    .join('');

  return header + values;
}
