import type { LegendConfig, SeriesConfig } from '../types';

export interface LegendElement {
  element: HTMLDivElement;
  destroy: () => void;
}

export function createLegend(
  container: HTMLElement,
  series: SeriesConfig[],
  config?: LegendConfig
): LegendElement {
  const position = config?.position ?? 'bottom';
  const align = config?.align ?? 'center';
  const gap = config?.gap ?? 10;

  const element = document.createElement('div');
  element.className = 'swp-chart-legend';

  // Container styles based on position
  const isVertical = position === 'left' || position === 'right';

  // Calculate padding based on position and gap
  let padding: string;
  if (position === 'left') {
    padding = `0 ${gap}px 0 0`;
  } else if (position === 'right') {
    padding = `0 0 0 ${gap}px`;
  } else if (position === 'top') {
    padding = `0 0 ${gap}px 0`;
  } else {
    padding = `${gap}px 0 0 0`;
  }

  Object.assign(element.style, {
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    gap: isVertical ? '8px' : '20px',
    justifyContent: mapAlign(align),
    alignItems: isVertical ? 'flex-start' : 'center',
    padding,
  });

  // Create legend items
  for (const s of series) {
    // For pie charts, calculate total and show with unit
    let displayName = s.name;
    if (s.type === 'pie') {
      const total = s.data.reduce((sum, point) => sum + point.y, 0);
      const unit = s.unit ? ` ${s.unit}` : '';
      displayName = `${s.name} ${total}${unit}`;
    }
    const item = createLegendItem(displayName, s.color);
    element.appendChild(item);
  }

  // Insert based on position
  if (position === 'top') {
    container.insertBefore(element, container.firstChild);
  } else if (position === 'bottom') {
    container.appendChild(element);
  } else if (position === 'left') {
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.alignItems = 'center';
    container.insertBefore(element, container.firstChild);
  } else if (position === 'right') {
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.alignItems = 'center';
    container.appendChild(element);
  }

  const destroy = (): void => {
    element.remove();
  };

  return { element, destroy };
}

function createLegendItem(name: string, color: string): HTMLDivElement {
  const item = document.createElement('div');
  item.className = 'swp-chart-legend-item';

  Object.assign(item.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
  });

  const dot = document.createElement('div');
  dot.className = 'swp-chart-legend-dot';

  Object.assign(dot.style, {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: color,
  });

  const label = document.createElement('span');
  label.textContent = name;

  item.appendChild(dot);
  item.appendChild(label);

  return item;
}

function mapAlign(align: 'start' | 'center' | 'end'): string {
  switch (align) {
    case 'start':
      return 'flex-start';
    case 'end':
      return 'flex-end';
    default:
      return 'center';
  }
}
