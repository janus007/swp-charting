import type { ChartOptions, SeriesConfig, AnnotationConfig } from '../types';

/**
 * Input data for revenue/utilization/budget combo chart
 */
export interface RevenueUtilizationData {
  time: string;           // Week ID or date (e.g., "Uge 48")
  index: number;          // Relative index, 0 = now
  revenue: number;        // Revenue in DKK
  budget: number;         // Budget revenue in DKK
  utilization: number;    // 0-1, utilization rate
  isForecast: boolean;    // true = forecast, false = actual
}

/**
 * Configuration options for the combo chart
 */
export interface RevenueUtilizationBudgetOptions {
  width?: number;
  height?: number;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  nowLabel?: string;        // Label for "now" line (default: "Nu")
  xAxisLabel?: string;      // Centered x-axis label (default: "Uge")
  colors?: {
    revenue?: string;
    utilization?: string;
    budget?: string;
    nowLine?: string;
  };
}

const DEFAULT_COLORS = {
  revenue: '#3b82f6',      // Blue
  utilization: '#10b981',  // Green
  budget: '#f59e0b',       // Orange
  nowLine: '#374151',      // Dark gray
};

/**
 * Creates chart options for a revenue/utilization/budget combo chart
 *
 * Features:
 * - Revenue as bars on left Y-axis (DKK)
 * - Utilization as line on right Y-axis (0-100%)
 * - Budget as line on left Y-axis (DKK)
 * - Solid styles for actual data, dashed/transparent for forecast
 * - Vertical "Now" line at index = 0
 */
export function createRevenueUtilizationBudgetChart(
  data: RevenueUtilizationData[],
  options: RevenueUtilizationBudgetOptions = {}
): ChartOptions {
  const {
    width = 700,
    height = 400,
    showLegend = true,
    legendPosition = 'bottom',
    nowLabel = 'Nu',
    xAxisLabel = 'Uge',
    colors = {},
  } = options;

  const chartColors = { ...DEFAULT_COLORS, ...colors };

  // Sort data by index
  const sortedData = [...data].sort((a, b) => a.index - b.index);

  // Get categories (time labels)
  const categories = sortedData.map((d) => d.time);

  // Find index of "now" (where index = 0)
  const nowCategory = sortedData.find((d) => d.index === 0)?.time;

  // Split data by forecast status
  const actualData = sortedData.filter((d) => !d.isForecast);
  const forecastData = sortedData.filter((d) => d.isForecast);

  // Get last actual data point for connecting lines
  const lastActual = actualData[actualData.length - 1];

  // Create series
  const series: SeriesConfig[] = [];

  // 1) Revenue Actual (bars, solid)
  if (actualData.length > 0) {
    series.push({
      name: 'Omsætning – Realiseret',
      color: chartColors.revenue,
      type: 'bar',
      unit: 'kr',
      yAxisIndex: 0,
      data: actualData.map((d) => ({ x: d.time, y: d.revenue })),
      bar: { opacity: 1 },
      area: { gradient: false },
    });
  }

  // 2) Revenue Forecast (bars, transparent)
  if (forecastData.length > 0) {
    series.push({
      name: 'Omsætning – Forecast',
      color: chartColors.revenue,
      type: 'bar',
      unit: 'kr',
      yAxisIndex: 0,
      data: forecastData.map((d) => ({ x: d.time, y: d.revenue })),
      bar: { opacity: 0.35 },
      area: { gradient: false },
    });
  }

  // 3) Utilization Actual (line, solid, right axis)
  if (actualData.length > 0) {
    series.push({
      name: 'Belægningsgrad – Realiseret',
      color: chartColors.utilization,
      type: 'line',
      unit: '%',
      yAxisIndex: 1,
      data: actualData.map((d) => ({ x: d.time, y: d.utilization * 100 })),
      line: { width: 2.5, curve: 'linear' },
      point: { style: 'dot', radius: 0 },
      showArea: false,
    });
  }

  // 4) Utilization Forecast (line, dashed, right axis)
  if (forecastData.length > 0) {
    // Include last actual point to connect the lines
    const utilizationForecastData = lastActual
      ? [{ x: lastActual.time, y: lastActual.utilization * 100 }, ...forecastData.map((d) => ({ x: d.time, y: d.utilization * 100 }))]
      : forecastData.map((d) => ({ x: d.time, y: d.utilization * 100 }));

    series.push({
      name: 'Belægningsgrad – Forecast',
      color: chartColors.utilization,
      type: 'line',
      unit: '%',
      yAxisIndex: 1,
      data: utilizationForecastData,
      line: { width: 2.5, curve: 'linear', dashArray: '4 4' },
      point: { style: 'dot', radius: 0 },
      showArea: false,
    });
  }

  // 5) Budget Actual (line, solid, left axis)
  if (actualData.length > 0) {
    series.push({
      name: 'Budget Omsætning – Realiseret',
      color: chartColors.budget,
      type: 'line',
      unit: 'kr',
      yAxisIndex: 0,
      data: actualData.map((d) => ({ x: d.time, y: d.budget })),
      line: { width: 2.5, curve: 'linear' },
      point: { style: 'dot', radius: 0 },
      showArea: false,
    });
  }

  // 6) Budget Forecast (line, dashed, left axis)
  if (forecastData.length > 0) {
    // Include last actual point to connect the lines
    const budgetForecastData = lastActual
      ? [{ x: lastActual.time, y: lastActual.budget }, ...forecastData.map((d) => ({ x: d.time, y: d.budget }))]
      : forecastData.map((d) => ({ x: d.time, y: d.budget }));

    series.push({
      name: 'Budget Omsætning – Forecast',
      color: chartColors.budget,
      type: 'line',
      unit: 'kr',
      yAxisIndex: 0,
      data: budgetForecastData,
      line: { width: 2.5, curve: 'linear', dashArray: '4 4' },
      point: { style: 'dot', radius: 0 },
      showArea: false,
    });
  }

  // Create annotations (Now line)
  const annotations: AnnotationConfig[] = [];
  if (nowCategory) {
    annotations.push({
      type: 'verticalLine',
      x: nowCategory,
      color: chartColors.nowLine,
      label: nowLabel,
      labelPosition: 'top',
      dashArray: '4 4',
    });
  }

  // Calculate max revenue/budget for left Y-axis
  const allRevenueBudget = sortedData.flatMap((d) => [d.revenue, d.budget]);
  const maxValue = Math.max(...allRevenueBudget);
  const yMaxLeft = Math.ceil(maxValue / 10000) * 10000; // Round up to nearest 10k

  return {
    width,
    height,
    xAxis: { categories, label: xAxisLabel },
    yAxis: [
      {
        min: 0,
        max: yMaxLeft,
        format: (v) => `${(v / 1000).toFixed(0)}k`,
      },
      {
        min: 0,
        max: 100,
        format: (v) => `${v}%`,
      },
    ],
    series,
    annotations,
    legend: showLegend ? { position: legendPosition } : false,
    tooltip: { fontSize: 13 },
    padding: { right: 60 }, // Extra space for right Y-axis
  };
}
