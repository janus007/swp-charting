import { createRect, createLine, setAttributes } from '../render/svg';
import type { TooltipElement } from '../render/tooltip';
import type { ComputedPoint, ResolvedPadding, SeriesConfig, TooltipData, PieStyle } from '../types';
import { getPointHoverRadius, getPointRadius } from '../render/line';
import { getSliceTransform, type PieSlice } from '../render/pie';

export interface HoverState {
  hoverLine?: SVGLineElement;
  hoverArea?: SVGRectElement;
  currentIndex: number;
  destroy: () => void;
}

export interface HoverOptions {
  svg: SVGSVGElement;
  container: HTMLElement;
  tooltip: TooltipElement | null;
  series: SeriesConfig[];
  pointsBySeries: ComputedPoint[][];
  pointElements: SVGCircleElement[][];
  barElements: SVGRectElement[][];
  padding: ResolvedPadding;
  chartWidth: number;
  chartHeight: number;
  xPositions: number[];
}

export function setupHover(options: HoverOptions): HoverState {
  const {
    svg,
    container,
    tooltip,
    series,
    pointsBySeries,
    pointElements,
    barElements,
    padding,
    chartWidth,
    chartHeight,
    xPositions,
  } = options;

  let currentIndex = -1;

  // Create hover line
  const hoverLine = createLine(0, padding.top, 0, padding.top + chartHeight, {
    stroke: '#ddd',
    'stroke-width': 1,
    opacity: 0,
  });
  svg.appendChild(hoverLine);

  // Create invisible hover area
  const hoverArea = createRect(
    padding.left,
    padding.top,
    chartWidth,
    chartHeight,
    {
      fill: 'transparent',
      style: 'cursor: pointer',
    }
  );

  const handleMouseMove = (e: MouseEvent): void => {
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find nearest x position
    let nearestIndex = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < xPositions.length; i++) {
      const pos = xPositions[i];
      if (pos === undefined) continue;
      const dist = Math.abs(pos - mouseX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    const x = xPositions[nearestIndex];
    if (x === undefined) return;

    // Update hover line
    setAttributes(hoverLine, { x1: x, x2: x, opacity: 1 });

    // Update point sizes and bar styles
    updatePointSizes(pointElements, series, nearestIndex, true, xPositions);
    updateBarStyles(barElements, series, nearestIndex, true, xPositions);

    // Update tooltip
    if (tooltip && currentIndex !== nearestIndex) {
      const tooltipData = buildTooltipData(
        nearestIndex,
        series,
        pointsBySeries,
        xPositions
      );

      if (tooltipData) {
        const containerRect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const offsetX = svgRect.left - containerRect.left;
        const offsetY = svgRect.top - containerRect.top;

        // Find average Y position of points at this index
        let avgY = 0;
        let count = 0;
        for (const points of pointsBySeries) {
          const point = points.find((p) => Math.abs(p.x - x) < 1);
          if (point) {
            avgY += point.y;
            count++;
          }
        }
        avgY = count > 0 ? avgY / count : padding.top + chartHeight / 2;

        // First show tooltip off-screen to measure its width
        tooltip.show(-1000, -1000, tooltipData);
        const tooltipWidth = tooltip.element.offsetWidth;

        // Flip tooltip til venstre hvis den ville gå udenfor højre kant
        const svgWidth = svgRect.width;
        const tooltipX = (x + tooltipWidth + 15) > svgWidth
          ? offsetX + x - tooltipWidth - 15
          : offsetX + x + 15;

        tooltip.show(tooltipX, offsetY + avgY - 20, tooltipData);
      }

      currentIndex = nearestIndex;
    }
  };

  const handleMouseLeave = (): void => {
    setAttributes(hoverLine, { opacity: 0 });
    updatePointSizes(pointElements, series, -1, false, xPositions);
    updateBarStyles(barElements, series, -1, false, xPositions);
    tooltip?.hide();
    currentIndex = -1;
  };

  hoverArea.addEventListener('mousemove', handleMouseMove);
  hoverArea.addEventListener('mouseleave', handleMouseLeave);

  svg.appendChild(hoverArea);

  const destroy = (): void => {
    hoverArea.removeEventListener('mousemove', handleMouseMove);
    hoverArea.removeEventListener('mouseleave', handleMouseLeave);
  };

  return {
    hoverLine,
    hoverArea,
    currentIndex,
    destroy,
  };
}

function updatePointSizes(
  pointElements: SVGCircleElement[][],
  series: SeriesConfig[],
  activeIndex: number,
  isHovering: boolean,
  xPositions: number[]
): void {
  const activeX = activeIndex >= 0 ? xPositions[activeIndex] : undefined;

  pointElements.forEach((points, seriesIdx) => {
    const seriesConfig = series[seriesIdx];
    if (!seriesConfig) return;

    const pointStyle = seriesConfig.point;
    const normalRadius = getPointRadius(pointStyle);
    const hoverRadius = getPointHoverRadius(pointStyle);

    points.forEach((el) => {
      const cx = parseFloat(el.getAttribute('cx') ?? '0');
      const isActive = isHovering && activeX !== undefined && Math.abs(cx - activeX) < 1;
      const r = isActive ? hoverRadius : normalRadius;
      el.setAttribute('r', String(r));
    });
  });
}

function buildTooltipData(
  index: number,
  series: SeriesConfig[],
  pointsBySeries: ComputedPoint[][],
  xPositions: number[]
): TooltipData | null {
  const x = xPositions[index];
  if (x === undefined) return null;

  let xLabel = '';
  const values: TooltipData['values'] = [];

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    const points = pointsBySeries[i];
    if (!s || !points) continue;

    // Find point at this x position
    const point = points.find((p) => Math.abs(p.x - x) < 1);
    if (point) {
      if (!xLabel) xLabel = point.dataX;
      values.push({
        name: s.name,
        value: point.dataY,
        color: s.color,
      });
    }
  }

  if (!xLabel) return null;

  return { x: xLabel, values };
}

function updateBarStyles(
  barElements: SVGRectElement[][],
  series: SeriesConfig[],
  activeIndex: number,
  isHovering: boolean,
  xPositions: number[]
): void {
  const activeX = activeIndex >= 0 ? xPositions[activeIndex] : undefined;

  barElements.forEach((bars, seriesIdx) => {
    const seriesConfig = series[seriesIdx];
    if (!seriesConfig) return;

    const baseOpacity = seriesConfig.bar?.opacity ?? 1;

    bars.forEach((rect) => {
      const cx = parseFloat(rect.getAttribute('x') ?? '0');
      const width = parseFloat(rect.getAttribute('width') ?? '0');
      const centerX = cx + width / 2;
      const isActive = isHovering && activeX !== undefined && Math.abs(centerX - activeX) < width;

      // Dim non-active bars slightly when hovering
      const opacity = isHovering
        ? (isActive ? baseOpacity : baseOpacity * 0.6)
        : baseOpacity;

      rect.setAttribute('opacity', String(opacity));
    });
  });
}

// ============================================================================
// Pie Chart Hover
// ============================================================================

export interface PieHoverOptions {
  svg: SVGSVGElement;
  container: HTMLElement;
  tooltip: TooltipElement | null;
  slices: PieSlice[];
  pieStyle?: PieStyle;
  centerX: number;
  centerY: number;
}

export function setupPieHover(options: PieHoverOptions): HoverState {
  const { svg, container, tooltip, slices, pieStyle, centerX, centerY } = options;

  const hoverOffset = pieStyle?.hoverOffset ?? 8;
  let currentIndex = -1;

  const handleSliceEnter = (slice: PieSlice): void => {
    // Expand this slice
    slice.path.style.transform = getSliceTransform(slice.midAngle, hoverOffset);

    // Dim other slices
    slices.forEach((s) => {
      if (s !== slice) {
        s.path.style.opacity = '0.6';
      }
    });

    // Show tooltip
    if (tooltip) {
      const containerRect = container.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const offsetX = svgRect.left - containerRect.left;
      const offsetY = svgRect.top - containerRect.top;

      const tooltipData: TooltipData = {
        x: slice.name,
        values: [{
          name: slice.name,
          value: slice.value,
          color: slice.color,
          percent: slice.percent,
          ...(slice.unit && { unit: slice.unit }),
          ...(slice.breakdown && { breakdown: slice.breakdown }),
        }],
      };

      // Position tooltip near the slice
      const tooltipX = offsetX + centerX + Math.cos(slice.midAngle) * 60;
      const tooltipY = offsetY + centerY + Math.sin(slice.midAngle) * 60;

      // First show off-screen to measure
      tooltip.show(-1000, -1000, tooltipData);
      const tooltipWidth = tooltip.element.offsetWidth;
      const tooltipHeight = tooltip.element.offsetHeight;

      // Adjust position based on which quadrant the slice is in
      let finalX = tooltipX;
      let finalY = tooltipY - tooltipHeight / 2;

      // If slice is on the left side, position tooltip to the left
      if (Math.cos(slice.midAngle) < 0) {
        finalX = tooltipX - tooltipWidth;
      }

      // Keep within SVG bounds
      const svgWidth = svgRect.width;
      const svgHeight = svgRect.height;

      if (finalX + tooltipWidth > offsetX + svgWidth) {
        finalX = offsetX + svgWidth - tooltipWidth - 10;
      }
      if (finalX < offsetX) {
        finalX = offsetX + 10;
      }
      if (finalY < offsetY) {
        finalY = offsetY + 10;
      }
      if (finalY + tooltipHeight > offsetY + svgHeight) {
        finalY = offsetY + svgHeight - tooltipHeight - 10;
      }

      tooltip.show(finalX, finalY, tooltipData);
    }

    currentIndex = slice.seriesIndex;
  };

  const handleSliceLeave = (): void => {
    // Reset all slices
    slices.forEach((s) => {
      s.path.style.transform = '';
      s.path.style.opacity = '1';
    });

    tooltip?.hide();
    currentIndex = -1;
  };

  // Store handlers for cleanup
  const sliceHandlers: Map<PieSlice, () => void> = new Map();

  // Add event listeners to each slice
  slices.forEach((slice) => {
    const handler = (): void => handleSliceEnter(slice);
    sliceHandlers.set(slice, handler);
    slice.path.addEventListener('mouseenter', handler);
    slice.path.addEventListener('mouseleave', handleSliceLeave);
  });

  const destroy = (): void => {
    slices.forEach((slice) => {
      const handler = sliceHandlers.get(slice);
      if (handler) {
        slice.path.removeEventListener('mouseenter', handler);
      }
      slice.path.removeEventListener('mouseleave', handleSliceLeave);
    });
  };

  return {
    currentIndex,
    destroy,
  };
}
