import { createRect, createLine, setAttributes } from '../render/svg';
import type { TooltipElement } from '../render/tooltip';
import type {
  ChartClickEventDetail,
  ChartClickPoint,
  ChartSelectEventDetail,
  ComputedPoint,
  ResolvedPadding,
  SeriesConfig,
  TooltipData,
  PieStyle,
} from '../types';
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

  // Rectangle selection state
  let isDragging = false;
  let dragStart: { x: number; y: number } | null = null;
  let selectionRect: SVGRectElement | null = null;

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

  // Track if drag happened to prevent click event
  let wasDragging = false;

  const handleMouseDown = (e: MouseEvent): void => {
    // Clear any existing selection first
    if (selectionRect) {
      selectionRect.remove();
      selectionRect = null;
      resetElementHighlights(pointElements, barElements, series);
    }

    const rect = svg.getBoundingClientRect();
    dragStart = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isDragging = true;
    wasDragging = false;

    // Create selection rectangle (invisible at first)
    selectionRect = createRect(dragStart.x, dragStart.y, 0, 0, {
      fill: 'rgba(59, 130, 246, 0.15)',
      stroke: '#3b82f6',
      'stroke-width': 1,
      'stroke-dasharray': '4 2',
      'pointer-events': 'none',
    });
    svg.appendChild(selectionRect);
  };

  const handleDragMove = (e: MouseEvent): void => {
    if (!isDragging || !dragStart || !selectionRect) return;

    const rect = svg.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Calculate rectangle bounds (handle all drag directions)
    const minX = Math.min(dragStart.x, currentX);
    const minY = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    // Mark as dragging if moved more than 5px
    if (width > 5 || height > 5) {
      wasDragging = true;
      // Hide hover line and tooltip during drag
      setAttributes(hoverLine, { opacity: 0 });
      tooltip?.hide();
    }

    setAttributes(selectionRect, { x: minX, y: minY, width, height });

    // Highlight elements within the selection rectangle
    if (wasDragging) {
      highlightElementsInRect(
        minX, minX + width, minY, minY + height,
        pointElements, barElements, series, pointsBySeries
      );
    }
  };

  const handleMouseUp = (e: MouseEvent): void => {
    if (!isDragging || !dragStart) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    // Calculate selection bounds
    const minX = Math.min(dragStart.x, endX);
    const maxX = Math.max(dragStart.x, endX);
    const minY = Math.min(dragStart.y, endY);
    const maxY = Math.max(dragStart.y, endY);

    // Minimum drag distance to trigger selection (10px)
    const isDragSelection = (maxX - minX > 10) || (maxY - minY > 10);

    if (isDragSelection) {
      // Find all points within the rectangle
      const selectedPoints = findPointsInRect(
        minX, maxX, minY, maxY,
        series, pointsBySeries, barElements
      );

      if (selectedPoints.points.length > 0) {
        const chartType = series[0]?.type === 'bar' ? 'bar' : 'line';

        const detail: ChartSelectEventDetail = {
          type: chartType,
          points: selectedPoints.points,
          bounds: selectedPoints.bounds,
        };

        document.dispatchEvent(new CustomEvent('swp-chart-select', { detail }));
      }
    }

    // Stop dragging but keep rectangle and highlights visible
    isDragging = false;
    dragStart = null;
  };

  const handleClick = (e: MouseEvent): void => {
    // Don't fire click if we just finished a drag selection
    if (wasDragging) {
      wasDragging = false;
      return;
    }

    // Clear any existing selection rectangle and highlights
    if (selectionRect) {
      selectionRect.remove();
      selectionRect = null;
      resetElementHighlights(pointElements, barElements, series);
    }

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

    // Build click data with all points at this x position
    let xLabel = '';
    const points: ChartClickPoint[] = [];

    for (let i = 0; i < series.length; i++) {
      const s = series[i];
      const seriesPoints = pointsBySeries[i];
      if (!s || !seriesPoints) continue;

      const point = seriesPoints.find((p) => Math.abs(p.x - x) < 1);
      if (point) {
        if (!xLabel) xLabel = point.dataX;

        // Find the original data point to get the ID
        const originalDataPoint = s.data.find((d) => d.x === point.dataX);

        points.push({
          seriesName: s.name,
          seriesIndex: i,
          value: point.dataY,
          color: s.color,
          ...(originalDataPoint?.id && { id: originalDataPoint.id }),
          ...(s.unit && { unit: s.unit }),
        });
      }
    }

    if (xLabel && points.length > 0) {
      // Determine chart type from first series
      const chartType = series[0]?.type === 'bar' ? 'bar' : 'line';

      const detail: ChartClickEventDetail = {
        type: chartType,
        x: xLabel,
        points,
      };

      document.dispatchEvent(new CustomEvent('swp-chart-click', { detail }));
    }
  };

  hoverArea.addEventListener('mousemove', handleMouseMove);
  hoverArea.addEventListener('mouseleave', handleMouseLeave);
  hoverArea.addEventListener('click', handleClick);
  hoverArea.addEventListener('mousedown', handleMouseDown);

  // Document-level listeners for reliable drag handling
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleMouseUp);

  svg.appendChild(hoverArea);

  const destroy = (): void => {
    hoverArea.removeEventListener('mousemove', handleMouseMove);
    hoverArea.removeEventListener('mouseleave', handleMouseLeave);
    hoverArea.removeEventListener('click', handleClick);
    hoverArea.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleMouseUp);
    if (selectionRect) {
      selectionRect.remove();
      selectionRect = null;
    }
    resetElementHighlights(pointElements, barElements, series);
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

interface SelectionResult {
  points: ChartClickPoint[];
  bounds: {
    x1: string;
    x2: string;
    y1: number;
    y2: number;
  };
}

function findPointsInRect(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  series: SeriesConfig[],
  pointsBySeries: ComputedPoint[][],
  barElements: SVGRectElement[][]
): SelectionResult {
  const points: ChartClickPoint[] = [];
  let x1Label = '';
  let x2Label = '';
  let y1 = Infinity;
  let y2 = -Infinity;

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    const seriesPoints = pointsBySeries[i];
    if (!s || !seriesPoints) continue;

    // For line charts, check point positions
    if (s.type !== 'bar') {
      for (const point of seriesPoints) {
        if (point.x >= minX && point.x <= maxX &&
            point.y >= minY && point.y <= maxY) {
          const originalDataPoint = s.data.find(d => d.x === point.dataX);
          points.push({
            seriesName: s.name,
            seriesIndex: i,
            value: point.dataY,
            color: s.color,
            ...(originalDataPoint?.id && { id: originalDataPoint.id }),
            ...(s.unit && { unit: s.unit }),
          });

          // Track bounds
          if (!x1Label || point.dataX < x1Label) x1Label = point.dataX;
          if (!x2Label || point.dataX > x2Label) x2Label = point.dataX;
          if (point.dataY < y1) y1 = point.dataY;
          if (point.dataY > y2) y2 = point.dataY;
        }
      }
    }

    // For bar charts, check bar element positions
    const bars = barElements[i];
    if (s.type === 'bar' && bars) {
      bars.forEach((rect, barIdx) => {
        const barX = parseFloat(rect.getAttribute('x') ?? '0');
        const barY = parseFloat(rect.getAttribute('y') ?? '0');
        const barWidth = parseFloat(rect.getAttribute('width') ?? '0');
        const barHeight = parseFloat(rect.getAttribute('height') ?? '0');
        const centerX = barX + barWidth / 2;

        // Check if bar overlaps with selection (any part of bar intersects rectangle)
        if (centerX >= minX && centerX <= maxX &&
            barY <= maxY && (barY + barHeight) >= minY) {
          const dataPoint = s.data[barIdx];
          if (dataPoint) {
            points.push({
              seriesName: s.name,
              seriesIndex: i,
              value: dataPoint.y,
              color: s.color,
              ...(dataPoint.id && { id: dataPoint.id }),
              ...(s.unit && { unit: s.unit }),
            });

            // Track bounds
            if (!x1Label || dataPoint.x < x1Label) x1Label = dataPoint.x;
            if (!x2Label || dataPoint.x > x2Label) x2Label = dataPoint.x;
            if (dataPoint.y < y1) y1 = dataPoint.y;
            if (dataPoint.y > y2) y2 = dataPoint.y;
          }
        }
      });
    }
  }

  return {
    points,
    bounds: {
      x1: x1Label || '',
      x2: x2Label || '',
      y1: y1 === Infinity ? 0 : y1,
      y2: y2 === -Infinity ? 0 : y2,
    },
  };
}

function highlightElementsInRect(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  pointElements: SVGCircleElement[][],
  barElements: SVGRectElement[][],
  series: SeriesConfig[],
  pointsBySeries: ComputedPoint[][]
): void {
  // Highlight line chart points
  pointElements.forEach((points, seriesIdx) => {
    const seriesConfig = series[seriesIdx];
    const seriesPoints = pointsBySeries[seriesIdx];
    if (!seriesConfig || !seriesPoints) return;

    const pointStyle = seriesConfig.point;
    const normalRadius = getPointRadius(pointStyle);
    const hoverRadius = getPointHoverRadius(pointStyle);

    points.forEach((el, pointIdx) => {
      const point = seriesPoints[pointIdx];
      if (!point) return;

      const isInRect = point.x >= minX && point.x <= maxX &&
                       point.y >= minY && point.y <= maxY;

      el.setAttribute('r', String(isInRect ? hoverRadius : normalRadius));
    });
  });

  // Highlight bar chart bars
  barElements.forEach((bars, seriesIdx) => {
    const seriesConfig = series[seriesIdx];
    if (!seriesConfig) return;

    const baseOpacity = seriesConfig.bar?.opacity ?? 1;

    bars.forEach((rect) => {
      const barX = parseFloat(rect.getAttribute('x') ?? '0');
      const barY = parseFloat(rect.getAttribute('y') ?? '0');
      const barWidth = parseFloat(rect.getAttribute('width') ?? '0');
      const barHeight = parseFloat(rect.getAttribute('height') ?? '0');
      const centerX = barX + barWidth / 2;

      // Check if bar overlaps with selection (any part of bar intersects rectangle)
      const isInRect = centerX >= minX && centerX <= maxX &&
                       barY <= maxY && (barY + barHeight) >= minY;

      rect.setAttribute('opacity', String(isInRect ? baseOpacity : baseOpacity * 0.4));
    });
  });
}

function resetElementHighlights(
  pointElements: SVGCircleElement[][],
  barElements: SVGRectElement[][],
  series: SeriesConfig[]
): void {
  // Reset point sizes
  pointElements.forEach((points, seriesIdx) => {
    const seriesConfig = series[seriesIdx];
    if (!seriesConfig) return;

    const pointStyle = seriesConfig.point;
    const normalRadius = getPointRadius(pointStyle);

    points.forEach((el) => {
      el.setAttribute('r', String(normalRadius));
    });
  });

  // Reset bar opacities
  barElements.forEach((bars, seriesIdx) => {
    const seriesConfig = series[seriesIdx];
    if (!seriesConfig) return;

    const baseOpacity = seriesConfig.bar?.opacity ?? 1;

    bars.forEach((rect) => {
      rect.setAttribute('opacity', String(baseOpacity));
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

  const handleSliceClick = (slice: PieSlice): void => {
    const detail: ChartClickEventDetail = {
      type: 'pie',
      points: [{
        seriesName: slice.name,
        seriesIndex: slice.seriesIndex,
        value: slice.value,
        color: slice.color,
        percent: slice.percent,
        ...(slice.id && { id: slice.id }),
        ...(slice.unit && { unit: slice.unit }),
      }],
    };

    document.dispatchEvent(new CustomEvent('swp-chart-click', { detail }));
  };

  // Store handlers for cleanup
  const sliceHandlers: Map<PieSlice, { enter: () => void; click: () => void }> = new Map();

  // Add event listeners to each slice
  slices.forEach((slice) => {
    const enterHandler = (): void => handleSliceEnter(slice);
    const clickHandler = (): void => handleSliceClick(slice);
    sliceHandlers.set(slice, { enter: enterHandler, click: clickHandler });
    slice.path.addEventListener('mouseenter', enterHandler);
    slice.path.addEventListener('mouseleave', handleSliceLeave);
    slice.path.addEventListener('click', clickHandler);
  });

  const destroy = (): void => {
    slices.forEach((slice) => {
      const handlers = sliceHandlers.get(slice);
      if (handlers) {
        slice.path.removeEventListener('mouseenter', handlers.enter);
        slice.path.removeEventListener('click', handlers.click);
      }
      slice.path.removeEventListener('mouseleave', handleSliceLeave);
    });
  };

  return {
    currentIndex,
    destroy,
  };
}
