import type {
  Chart,
  ChartOptions,
  ComputedPoint,
  ResolvedPadding,
  SeriesConfig,
  YAxisConfig,
} from './types';
import type { LinearScale } from './scales/linear';
import { createLinearScale } from './scales/linear';
import { createBandScale } from './scales/band';
import { createSvgRoot, createDefs } from './render/svg';
import { renderGrid } from './render/grid';
import { renderXAxis, renderYAxis, renderRightYAxis } from './render/axes';
import { renderAnnotations } from './render/annotations';
import { renderLine } from './render/line';
import { renderBar } from './render/bar';
import { renderPie } from './render/pie';
import { createTooltip, type TooltipElement } from './render/tooltip';
import { createLegend, type LegendElement } from './render/legend';
import { setupHover, setupPieHover, type HoverState } from './interaction/hover';
import { animateLine, animateArea, animatePoints } from './animation/line';
import { animateBars } from './animation/bar';
import { animatePieSlices } from './animation/pie';

const DEFAULT_WIDTH = 650;
const DEFAULT_HEIGHT = 350;
const DEFAULT_PADDING: ResolvedPadding = {
  top: 30,
  right: 40,
  bottom: 30,
  left: 60,
};

export function createChart(
  container: HTMLElement,
  options: ChartOptions
): Chart {
  let currentOptions = { ...options };
  let svg: SVGSVGElement | null = null;
  let tooltip: TooltipElement | null = null;
  let legend: LegendElement | null = null;
  let hoverState: HoverState | null = null;
  let resizeObserver: ResizeObserver | null = null;

  // Wrapper div for positioning
  const wrapper = document.createElement('div');
  wrapper.className = 'swp-chart-wrapper';
  wrapper.style.position = 'relative';
  container.appendChild(wrapper);

  // SVG container for flex layout (allows SVG to shrink when legend is beside it)
  const svgContainer = document.createElement('div');
  svgContainer.className = 'swp-chart-svg-container';
  svgContainer.style.flexShrink = '0';
  wrapper.appendChild(svgContainer);

  const render = (): void => {
    // Clean up previous render
    if (svg) svg.remove();
    if (tooltip) tooltip.destroy();
    if (legend) legend.destroy();
    if (hoverState) hoverState.destroy();

    const {
      series,
      xAxis,
      yAxis,
      padding: paddingOption,
      tooltip: tooltipOption,
      legend: legendOption,
      animation: animationOption,
    } = currentOptions;

    // Resolve dimensions
    const containerWidth = container.clientWidth;
    const width = currentOptions.width ?? (containerWidth > 0 ? containerWidth : DEFAULT_WIDTH);
    const baseHeight = currentOptions.height ?? DEFAULT_HEIGHT;
    // Add extra height for x-axis label if present
    const xAxisLabelHeight = xAxis?.label ? 18 : 0;
    const height = baseHeight + xAxisLabelHeight;

    // Resolve padding
    const padding: ResolvedPadding = {
      top: paddingOption?.top ?? DEFAULT_PADDING.top,
      right: paddingOption?.right ?? DEFAULT_PADDING.right,
      bottom: paddingOption?.bottom ?? DEFAULT_PADDING.bottom,
      left: paddingOption?.left ?? DEFAULT_PADDING.left,
    };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = baseHeight - padding.top - padding.bottom;  // Use baseHeight so chart area doesn't expand into label space

    // Check if this is a pie chart
    const isPieChart = series.length > 0 && series.every((s) => s.type === 'pie');

    // Pie chart rendering function
    const renderPieChart = (): void => {
      // Get pie style from first series (they should all be the same)
      const pieStyle = series[0]?.pie;

      // Check legend position
      const legendPosition = typeof legendOption === 'object' ? legendOption.position :
        (legendOption === true ? 'bottom' : undefined);
      const isLegendSide = legendPosition === 'left' || legendPosition === 'right';
      const hasLegend = legendOption !== false && legendOption !== undefined;

      // Calculate pie dimensions
      const hoverOffset = pieStyle?.hoverOffset ?? 8;
      const maxRadius = Math.min(chartWidth, chartHeight) / 2;
      const outerRadius = pieStyle?.outerRadius ?? maxRadius * 0.85;

      // Size SVG tightly around the pie (diameter + hover offset margin)
      const pieSize = (outerRadius * 2) + (hoverOffset * 2) + 4; // +4 for small buffer

      // Use tight sizing when legend is present
      const pieWidth = isLegendSide || !hasLegend ? pieSize : width;
      const pieHeight = hasLegend ? pieSize : height;

      // Create SVG
      svg = createSvgRoot(pieWidth, pieHeight);

      // Calculate center
      const centerX = pieWidth / 2;
      const centerY = pieHeight / 2;

      // Render pie slices
      const pieResult = renderPie({
        series,
        centerX,
        centerY,
        outerRadius,
        ...(pieStyle && { pieStyle }),
      });

      // Add slices to SVG
      pieResult.slices.forEach((slice) => svg!.appendChild(slice.path));

      // Animate slices
      if (animationOption !== false) {
        const config =
          typeof animationOption === 'object' ? animationOption : undefined;
        animatePieSlices(pieResult.slices, config).start();
      }

      // Create tooltip
      if (tooltipOption !== false) {
        const config =
          typeof tooltipOption === 'object' ? tooltipOption : undefined;
        tooltip = createTooltip(wrapper, config);
      }

      // Setup pie hover interaction
      hoverState = setupPieHover({
        svg,
        container: wrapper,
        tooltip,
        slices: pieResult.slices,
        centerX,
        centerY,
        ...(pieStyle && { pieStyle }),
      });

      svgContainer.appendChild(svg);

      // Create legend
      if (legendOption !== false && legendOption !== undefined) {
        const config =
          typeof legendOption === 'object' ? legendOption : undefined;
        legend = createLegend(wrapper, series, config);
      }
    };

    if (isPieChart) {
      renderPieChart();
      return;
    }

    // Count bar series and build map of which series have data at each x
    const barSeries = series.filter((s) => s.type === 'bar');
    const barSeriesCount = barSeries.length;

    // Build map: x-category -> list of bar series indices that have data there
    const barSeriesAtX: Map<string, number[]> = new Map();
    for (let i = 0; i < barSeries.length; i++) {
      const s = barSeries[i];
      if (!s) continue;
      for (const point of s.data) {
        const existing = barSeriesAtX.get(point.x) ?? [];
        existing.push(i);
        barSeriesAtX.set(point.x, existing);
      }
    }

    let outerPadding = 0;

    if (barSeriesCount > 0) {
      // Calculate width needed for bar groups (use max possible overlap)
      const defaultBarWidth = 20;
      const maxOverlap = Math.max(...Array.from(barSeriesAtX.values()).map(arr => arr.length), 1);
      const barGap = maxOverlap > 1 ? 4 : 0;
      const maxBarWidth = Math.max(
        ...barSeries.map((s) => {
          if (s.bar?.width === 'auto') return defaultBarWidth;
          return s.bar?.width ?? defaultBarWidth;
        })
      );
      const groupWidth = (maxBarWidth + barGap) * maxOverlap - barGap;
      outerPadding = groupWidth / 2 + 20; // Half group width + margin
    }

    // Create scales (xAxis is required for non-pie charts)
    if (!xAxis) {
      throw new Error('xAxis is required for line and bar charts');
    }

    const xScale = createBandScale(
      xAxis.categories,
      [padding.left, width - padding.right],
      { paddingOuter: outerPadding }
    );

    // Detect dual Y-axis mode
    const isDualAxis = Array.isArray(yAxis);
    const leftAxisConfig: YAxisConfig | undefined = isDualAxis ? yAxis[0] : yAxis;
    const rightAxisConfig: YAxisConfig | undefined = isDualAxis ? yAxis[1] : undefined;

    // Separate series by axis
    const leftAxisSeries = series.filter((s) => (s.yAxisIndex ?? 0) === 0);
    const rightAxisSeries = series.filter((s) => s.yAxisIndex === 1);

    // Calculate left Y-axis domain
    const yMin = leftAxisConfig?.min ?? 0;
    let yMax = leftAxisConfig?.max ?? calculateYMax(leftAxisSeries);
    if (yMin === yMax) yMax = yMin + 1;

    const yScale = createLinearScale(
      [yMin, yMax],
      [padding.top + chartHeight, padding.top]
    );

    // Calculate right Y-axis domain (if dual axis)
    let yScale2: LinearScale | null = null;
    if (isDualAxis && rightAxisSeries.length > 0) {
      const yMin2 = rightAxisConfig?.min ?? 0;
      let yMax2 = rightAxisConfig?.max ?? calculateYMax(rightAxisSeries);
      if (yMin2 === yMax2) yMax2 = yMin2 + 1;

      yScale2 = createLinearScale(
        [yMin2, yMax2],
        [padding.top + chartHeight, padding.top]
      );
    }

    // Create SVG
    svg = createSvgRoot(width, height);
    const defs = createDefs();
    svg.appendChild(defs);

    // Compute points for each series
    const pointsBySeries: ComputedPoint[][] = [];
    const pointElements: SVGCircleElement[][] = [];
    const barElements: SVGRectElement[][] = [];

    let barSeriesIndex = 0;
    const bandwidth = xScale.bandwidth();

    // Render grid
    const gridLines = renderGrid({
      scale: yScale,
      width,
      padding,
    });
    gridLines.forEach((line) => svg!.appendChild(line));

    // Render annotation regions (behind chart data)
    const annotationsOption = options.annotations;
    let annotationElements: ReturnType<typeof renderAnnotations> | null = null;
    if (annotationsOption && annotationsOption.length > 0) {
      annotationElements = renderAnnotations({
        annotations: annotationsOption,
        xScale,
        height,
        padding,
        categories: xAxis.categories,
      });
      // Regions rendered early so they appear behind chart data
      annotationElements.regions.forEach((region) => svg!.appendChild(region));
    }

    // Render left Y axis labels
    const yAxisOptions: Parameters<typeof renderYAxis>[0] = {
      scale: yScale,
      padding,
    };
    if (leftAxisConfig?.format) {
      yAxisOptions.format = leftAxisConfig.format;
    }
    const yLabels = renderYAxis(yAxisOptions);
    yLabels.forEach((label) => svg!.appendChild(label));

    // Render right Y axis labels (if dual axis)
    if (yScale2 && rightAxisConfig) {
      const rightAxisOptions: Parameters<typeof renderRightYAxis>[0] = {
        scale: yScale2,
        width,
        padding,
      };
      if (rightAxisConfig.format) {
        rightAxisOptions.format = rightAxisConfig.format;
      }
      const rightYLabels = renderRightYAxis(rightAxisOptions);
      rightYLabels.forEach((label) => svg!.appendChild(label));
    }

    // Render X axis labels
    const xLabels = renderXAxis({
      scale: xScale,
      height,
      padding,
      width,
      ...(xAxis.label && { label: xAxis.label }),
    });
    xLabels.forEach((label) => svg!.appendChild(label));

    // Get unique x positions from all series
    const xPositionSet = new Set<number>();

    // Render series
    for (let i = 0; i < series.length; i++) {
      const s = series[i];
      if (!s) continue;

      // Select correct Y scale based on yAxisIndex
      const seriesYScale = (s.yAxisIndex === 1 && yScale2) ? yScale2 : yScale;

      // Compute points
      const computedPoints: ComputedPoint[] = [];
      for (const point of s.data) {
        const x = xScale(point.x);
        if (x === undefined) continue;

        const y = seriesYScale(point.y);
        computedPoints.push({
          x,
          y,
          dataX: point.x,
          dataY: point.y,
        });

        xPositionSet.add(x);
      }

      pointsBySeries.push(computedPoints);

      // Render based on series type
      if (s.type === 'bar') {
        // Render bar chart
        const baseline = padding.top + chartHeight;
        const barResult = renderBar({
          series: s,
          computedPoints,
          padding,
          chartHeight,
          seriesIndex: barSeriesIndex,
          barSeriesAtX,
          bandwidth,
        });

        // Add gradient to defs
        if (barResult.gradient) {
          defs.appendChild(barResult.gradient);
        }

        // Add bar rects
        barResult.barRects.forEach((rect) => svg!.appendChild(rect));
        barElements.push(barResult.barRects);
        pointElements.push([]); // Empty points for bar series

        // Animate bars
        if (animationOption !== false) {
          const config =
            typeof animationOption === 'object' ? animationOption : undefined;
          animateBars(barResult.barRects, baseline, config).start();
        }

        barSeriesIndex++;
      } else {
        // Render line/area (default)
        const result = renderLine({
          series: s,
          computedPoints,
          padding,
          chartHeight,
          seriesIndex: i,
        });

        // Add gradient to defs
        if (result.gradient) {
          defs.appendChild(result.gradient);
        }

        // Add area path
        if (result.areaPath) {
          svg!.appendChild(result.areaPath);

          // Animate area
          if (animationOption !== false) {
            const config =
              typeof animationOption === 'object' ? animationOption : undefined;
            animateArea(result.areaPath, config).start();
          }
        }

        // Add line path
        svg!.appendChild(result.linePath);

        // Animate line
        if (animationOption !== false) {
          const config =
            typeof animationOption === 'object' ? animationOption : undefined;
          animateLine(result.linePath, config).start();
        }

        // Add points
        pointElements.push(result.points);
        result.points.forEach((point) => svg!.appendChild(point));
        barElements.push([]); // Empty bars for line series

        // Animate points
        if (animationOption !== false) {
          const config =
            typeof animationOption === 'object' ? animationOption : undefined;
          animatePoints(result.points, config).start();
        }
      }
    }

    // Render annotation lines and labels (on top of series)
    if (annotationElements) {
      annotationElements.lines.forEach((line) => svg!.appendChild(line));
      annotationElements.labels.forEach((label) => svg!.appendChild(label));
    }

    // Sort x positions
    const xPositions = Array.from(xPositionSet).sort((a, b) => a - b);

    // Create tooltip
    if (tooltipOption !== false) {
      const config =
        typeof tooltipOption === 'object' ? tooltipOption : undefined;
      tooltip = createTooltip(wrapper, config);
    }

    // Setup hover interaction
    hoverState = setupHover({
      svg,
      container: wrapper,
      tooltip,
      series,
      pointsBySeries,
      pointElements,
      barElements,
      padding,
      chartWidth,
      chartHeight,
      xPositions,
    });

    svgContainer.appendChild(svg);

    // Create legend
    if (legendOption !== false && legendOption !== undefined) {
      const config =
        typeof legendOption === 'object' ? legendOption : undefined;
      legend = createLegend(wrapper, series, config);
    }
  };

  // Initial render
  render();

  // Setup resize observer for auto-resize with debouncing
  if (!currentOptions.width) {
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        render();
      }, 150);
    });
    resizeObserver.observe(container);
  }

  const update = (newOptions: Partial<ChartOptions>): void => {
    currentOptions = { ...currentOptions, ...newOptions };
    render();
  };

  const resize = (): void => {
    render();
  };

  const destroy = (): void => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (hoverState) {
      hoverState.destroy();
    }
    if (tooltip) {
      tooltip.destroy();
    }
    if (legend) {
      legend.destroy();
    }
    wrapper.remove();
  };

  return { update, resize, destroy };
}

function calculateYMax(series: SeriesConfig[]): number {
  let max = 0;
  for (const s of series) {
    for (const point of s.data) {
      if (point.y > max) max = point.y;
    }
  }
  // Add some padding to max
  return Math.ceil(max * 1.1);
}
