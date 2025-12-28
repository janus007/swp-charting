// ============================================================================
// Chart Options
// ============================================================================

export interface ChartOptions {
  series: SeriesConfig[];
  xAxis?: XAxisConfig;
  width?: number;
  height?: number;
  padding?: Padding;
  yAxis?: YAxisConfig;
  tooltip?: TooltipConfig | boolean;
  legend?: LegendConfig | boolean;
  animation?: AnimationConfig | boolean;
}

export interface Padding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

// ============================================================================
// Axis Configuration
// ============================================================================

export interface XAxisConfig {
  categories: string[];
}

export interface YAxisConfig {
  min?: number;
  max?: number;
  ticks?: number;
  format?: (value: number) => string;
}

// ============================================================================
// Series Configuration
// ============================================================================

export interface SeriesConfig {
  name: string;
  color: string;
  data: DataPoint[];
  type?: 'line' | 'bar' | 'pie';
  unit?: string;              // Unit suffix for values, e.g. 't', 'kr', '%'
  showArea?: boolean;
  line?: LineStyle;
  point?: PointStyle;
  area?: AreaStyle;
  bar?: BarStyle;
  pie?: PieStyle;
}

export interface DataPoint {
  x: string;
  y: number;
}

export interface LineStyle {
  width?: number;
  opacity?: number;
  curve?: 'smooth' | 'linear';
}

export interface PointStyle {
  style?: 'circle' | 'dot';
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  hoverRadius?: number;
}

export interface AreaStyle {
  gradient?: GradientConfig | boolean;
  opacity?: number;
}

export interface GradientConfig {
  startOpacity?: number;
  endOpacity?: number;
  startOffset?: string;
  endOffset?: string;
}

export interface BarStyle {
  radius?: number;
  opacity?: number;
  width?: number | 'auto';
}

export interface PieStyle {
  innerRadius?: number;      // 0 = pie, >0 = donut (default: 0)
  outerRadius?: number;      // Outer radius in px (default: auto)
  padAngle?: number;         // Gap between slices in degrees (default: 0)
  hoverOffset?: number;      // How much slice moves out on hover (default: 8)
}

// ============================================================================
// Tooltip Configuration
// ============================================================================

export interface TooltipConfig {
  animation?: TooltipAnimation;
  fontSize?: number;           // Base font size in px (default: 12)
  render?: (point: TooltipData) => string;
}

export interface TooltipData {
  x: string;
  values: TooltipValue[];
}

export interface TooltipValue {
  name: string;
  value: number;
  color: string;
  unit?: string;             // Unit suffix for value
  percent?: number;          // For pie charts
  breakdown?: TooltipBreakdown[];  // For pie charts with multiple data points
}

export interface TooltipBreakdown {
  label: string;
  value: number;
}

export interface TooltipAnimation {
  duration?: number;
  easing?: string;
}

// ============================================================================
// Legend Configuration
// ============================================================================

export interface LegendConfig {
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  gap?: number;              // Gap between legend and chart in px (default: 10)
}

// ============================================================================
// Animation Configuration
// ============================================================================

export interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: string;
}

// ============================================================================
// Chart Instance
// ============================================================================

export interface Chart {
  update(options: Partial<ChartOptions>): void;
  resize(): void;
  destroy(): void;
}

// ============================================================================
// Internal Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface ComputedPoint extends Point {
  dataX: string;
  dataY: number;
}

export interface ResolvedPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ResolvedSeriesConfig extends SeriesConfig {
  computedPoints: ComputedPoint[];
}
