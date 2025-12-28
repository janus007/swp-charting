import { createPath, createCircle, createGradient } from './svg';
import { monotoneCurve } from '../curves/monotone';
import { linearCurve } from '../curves/linear';
import type { ComputedPoint, SeriesConfig, PointStyle, ResolvedPadding } from '../types';

export interface LineRenderResult {
  areaPath: SVGPathElement | undefined;
  linePath: SVGPathElement;
  points: SVGCircleElement[];
  gradient: SVGLinearGradientElement | undefined;
}

export interface LineRenderOptions {
  series: SeriesConfig;
  computedPoints: ComputedPoint[];
  padding: ResolvedPadding;
  chartHeight: number;
  seriesIndex: number;
}

export function renderLine(options: LineRenderOptions): LineRenderResult {
  const { series, computedPoints, padding, chartHeight, seriesIndex } = options;

  if (computedPoints.length === 0) {
    return {
      areaPath: undefined,
      linePath: createPath('', { fill: 'none' }),
      points: [],
      gradient: undefined,
    };
  }

  const curveType = series.line?.curve ?? 'smooth';
  const curveFunc = curveType === 'linear' ? linearCurve : monotoneCurve;
  const linePathD = curveFunc(computedPoints);

  // Create gradient if area is shown
  let gradient: SVGLinearGradientElement | undefined;
  let areaPath: SVGPathElement | undefined;

  const showArea = series.showArea !== false;
  const firstPoint = computedPoints[0];
  const lastPoint = computedPoints[computedPoints.length - 1];

  if (showArea && firstPoint && lastPoint && computedPoints.length >= 2) {
    const gradientConfig = series.area?.gradient;
    const gradientId = `gradient-${seriesIndex}`;

    if (gradientConfig !== false) {
      const config =
        typeof gradientConfig === 'object' ? gradientConfig : {};

      gradient = createGradient(
        gradientId,
        series.color,
        config.startOpacity ?? 0.4,
        config.endOpacity ?? 0.05,
        config.startOffset ?? '0%',
        config.endOffset ?? '40%'
      );

      // Create area path (line + close to baseline)
      const baseline = padding.top + chartHeight;
      const areaPathD = `${linePathD} L ${lastPoint.x},${baseline} L ${firstPoint.x},${baseline} Z`;

      areaPath = createPath(areaPathD, {
        fill: `url(#${gradientId})`,
        stroke: 'none',
      });
    }
  }

  // Create line path
  const lineWidth = series.line?.width ?? 2.5;
  const lineOpacity = series.line?.opacity ?? 1;
  const dashArray = series.line?.dashArray;

  const linePath = createPath(linePathD, {
    fill: 'none',
    stroke: series.color,
    'stroke-width': lineWidth,
    'stroke-opacity': lineOpacity,
    ...(dashArray && { 'stroke-dasharray': dashArray }),
  });

  // Create points
  const points = renderPoints(computedPoints, series.color, series.point);

  return {
    areaPath,
    linePath,
    points,
    gradient,
  };
}

function renderPoints(
  computedPoints: ComputedPoint[],
  seriesColor: string,
  pointStyle?: PointStyle
): SVGCircleElement[] {
  const style = pointStyle?.style ?? 'circle';
  const isCircle = style === 'circle';

  const radius = pointStyle?.radius ?? (isCircle ? 5 : 3);
  const fill = pointStyle?.fill ?? (isCircle ? '#fff' : seriesColor);
  const stroke = pointStyle?.stroke ?? (isCircle ? seriesColor : '#fff');
  const strokeWidth = pointStyle?.strokeWidth ?? 2.5;

  return computedPoints.map((point) =>
    createCircle(point.x, point.y, radius, {
      fill,
      stroke,
      'stroke-width': strokeWidth,
    })
  );
}

export function getPointHoverRadius(pointStyle?: PointStyle): number {
  const style = pointStyle?.style ?? 'circle';
  const isCircle = style === 'circle';
  const radius = pointStyle?.radius ?? (isCircle ? 5 : 3);
  return pointStyle?.hoverRadius ?? radius + 2;
}

export function getPointRadius(pointStyle?: PointStyle): number {
  const style = pointStyle?.style ?? 'circle';
  const isCircle = style === 'circle';
  return pointStyle?.radius ?? (isCircle ? 5 : 3);
}
