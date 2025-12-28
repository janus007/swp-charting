// ============================================================================
// Chart Options
// ============================================================================

export interface ChartOptions {
  series: SeriesConfig[];
  xAxis?: XAxisConfig;
  width?: number;
  height?: number;
  padding?: Padding;
  yAxis?: YAxisConfig | [YAxisConfig, YAxisConfig];  // Single or dual Y-axis
  tooltip?: TooltipConfig | boolean;
  legend?: LegendConfig | boolean;
  animation?: AnimationConfig | boolean;
  annotations?: AnnotationConfig[];
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
  label?: string;  // Centered label below x-axis (e.g., "Uge", "Month")
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
  yAxisIndex?: 0 | 1;         // 0 = left axis (default), 1 = right axis
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
  dashArray?: string;         // Dash pattern, e.g. "5,5" for dashed line
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
// Annotation Configuration
// ============================================================================

export interface AnnotationConfig {
  type: 'verticalLine';
  x: string | number;         // Category name or index
  color?: string;             // Line color (default: #666)
  label?: string;             // Label text
  labelPosition?: 'top' | 'bottom';  // Label position (default: top)
  dashArray?: string;         // Optional dash pattern
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
