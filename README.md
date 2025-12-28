# SWP Charting

A lightweight, zero-dependency SVG charting library for TypeScript/JavaScript.

**8.5 KB** gzipped — 8x smaller than Chart.js

## Features

- **Lightweight** — No dependencies, tiny bundle size
- **TypeScript** — Full type definitions included
- **Line, Bar & Pie Charts** — Smooth curves, grouped bars, pie/donut charts
- **Dual Y-Axis** — Left and right Y-axes with independent scales
- **Annotations** — Vertical lines and shaded regions
- **Smooth curves** — Monotone cubic spline (Fritsch-Carlson) prevents overshoot
- **Responsive** — Auto-resize with ResizeObserver
- **Interactive** — Hover tooltips, click events with data IDs
- **Customizable** — Line styles, point styles, bar styles, pie styles, legends

## Installation

```bash
npm install @sevenweirdpeople/swp-charting
```

## Quick Start

```typescript
import { createChart } from '@sevenweirdpeople/swp-charting';

createChart(document.getElementById('chart'), {
  xAxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun']
  },
  series: [
    {
      name: 'Revenue',
      color: '#8b5cf6',
      data: [
        { x: 'Jan', y: 120 },
        { x: 'Mar', y: 350 },
        { x: 'Maj', y: 280 },
      ]
    }
  ],
  legend: true
});
```

## API

### createChart(container, options)

Creates a new chart instance.

```typescript
const chart = createChart(element, options);

// Update data
chart.update({ series: [...] });

// Manual resize
chart.resize();

// Cleanup
chart.destroy();
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `series` | `SeriesConfig[]` | required | Array of data series |
| `xAxis` | `{ categories: string[] }` | required* | X-axis category labels (*not required for pie charts) |
| `width` | `number` | container width | Chart width in pixels |
| `height` | `number` | `350` | Chart height in pixels |
| `yAxis` | `YAxisConfig \| YAxisConfig[]` | auto | Y-axis configuration (array for dual axis) |
| `annotations` | `AnnotationConfig[]` | `[]` | Vertical lines and regions |
| `tooltip` | `boolean \| TooltipConfig` | `true` | Tooltip settings |
| `legend` | `boolean \| LegendConfig` | `false` | Legend settings |
| `animation` | `boolean \| AnimationConfig` | `true` | Load animation |
| `padding` | `Padding` | `{ top: 30, right: 40, bottom: 40, left: 60 }` | Chart padding |

### Series Configuration

```typescript
{
  name: 'Sales',
  color: '#8b5cf6',
  data: [{ x: 'Jan', y: 100, id: 'sale-jan' }, { x: 'Feb', y: 200 }],
  type: 'line',           // 'line' | 'bar' | 'pie' (default: 'line')
  unit: 'kr',             // Unit suffix for values in tooltips/legend (optional)
  yAxisIndex: 0,          // Which Y-axis to use (0 = left, 1 = right)

  // Line style (for type: 'line')
  line: {
    width: 2.5,           // Line thickness
    curve: 'smooth',      // 'smooth' | 'linear'
    dashArray: '4 4',     // Dashed line pattern (optional)
  },

  // Point style (for type: 'line')
  point: {
    style: 'circle',      // 'circle' (large, white fill) | 'dot' (small, colored fill)
    radius: 5,
    stroke: '#fff',
    strokeWidth: 2.5,
  },

  // Area fill (for type: 'line')
  showArea: true,
  area: {
    gradient: {
      startOpacity: 0.4,
      endOpacity: 0.05,
    }
  },

  // Bar style (for type: 'bar')
  bar: {
    width: 20,            // Bar width in pixels, or 'auto' (default: 20)
    radius: 0,            // Corner radius (default: 0)
    opacity: 1,           // Bar opacity 0-1 (default: 1)
  },

  // Pie style (for type: 'pie')
  pie: {
    innerRadius: 0,       // 0 = pie, >0 = donut (default: 0)
    outerRadius: 120,     // Outer radius in pixels (default: auto)
    hoverOffset: 8,       // How much slice moves out on hover (default: 8)
  }
}
```

### Y-Axis Configuration

```typescript
// Single Y-axis
{
  yAxis: {
    min: 0,
    max: 1000,
    ticks: 5,
    format: (v) => v.toLocaleString('da-DK') + ' kr'
  }
}

// Dual Y-axis
{
  yAxis: [
    { min: 0, max: 100000, format: (v) => `${v/1000}k` },  // Left axis (index 0)
    { min: 0, max: 100, format: (v) => `${v}%` },          // Right axis (index 1)
  ]
}
```

### Annotation Configuration

```typescript
{
  annotations: [
    // Vertical line
    {
      type: 'verticalLine',
      x: 'Mar',              // Category name or index
      color: '#666',
      width: 1.5,            // Line width (default: 1.5)
      dashArray: '4 4',      // Dashed pattern (optional)
      label: 'Nu',
      labelPosition: 'top',  // 'top' | 'bottom'
    },
    // Shaded region
    {
      type: 'region',
      x: 'Apr',              // Start category
      x2: 'Jun',             // End category
      backgroundColor: 'rgba(0,0,0,0.05)',
      color: '#666',         // Border color (optional)
    }
  ]
}
```

### Legend Configuration

```typescript
{
  legend: {
    position: 'bottom',   // 'top' | 'bottom' | 'left' | 'right'
    align: 'center',      // 'start' | 'center' | 'end'
    gap: 10               // Gap between legend and chart in px (default: 10)
  }
}
```

### Tooltip Configuration

```typescript
{
  tooltip: {
    fontSize: 14,         // Base font size in px (default: 12)
    animation: {
      duration: 150,
      easing: 'ease-out'
    },
    render: (point) => `<strong>${point.x}</strong>: ${point.values[0].value}`
  }
}
```

### Click Events

Charts emit click events with data point information:

```typescript
document.addEventListener('swp-chart-click', (e) => {
  const { type, x, points } = e.detail;
  // type: 'line' | 'bar' | 'pie'
  // x: category name (not for pie)
  // points: [{ id, seriesName, value, color, unit, percent }]
  console.log('Clicked:', points);
});

// Add IDs to data points for tracking
const series = [{
  name: 'Revenue',
  data: [
    { x: 'Q1', y: 1000, id: 'rev-q1-2024' },
    { x: 'Q2', y: 1200, id: 'rev-q2-2024' },
  ]
}];
```

## Examples

### Line Chart with Smooth Curves

```typescript
createChart(el, {
  xAxis: { categories: months },
  series: [{
    name: 'Sales',
    color: '#8b5cf6',
    data: [{ x: 'Mar', y: 350 }, { x: 'Jun', y: 850 }]
  }]
});
```

### Bar Chart

```typescript
createChart(el, {
  xAxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
  series: [{
    name: 'Revenue',
    color: '#8b5cf6',
    type: 'bar',
    data: [
      { x: 'Q1', y: 420 },
      { x: 'Q2', y: 580 },
      { x: 'Q3', y: 350 },
      { x: 'Q4', y: 720 },
    ],
    bar: { width: 30, radius: 4 }
  }],
  legend: true
});
```

### Pie / Donut Chart

```typescript
createChart(el, {
  width: 400,
  height: 300,
  series: [
    { name: 'Produkter', color: '#8b5cf6', type: 'pie', data: [{ x: '', y: 350 }] },
    { name: 'Services', color: '#3b82f6', type: 'pie', data: [{ x: '', y: 280 }] },
    { name: 'Support', color: '#f59e0b', type: 'pie', data: [{ x: '', y: 120 }] },
  ],
  legend: true
});

// Donut: add innerRadius
{ pie: { innerRadius: 40 } }
```

### Dual Y-Axis with Annotations

```typescript
createChart(el, {
  xAxis: { categories: weeks },
  yAxis: [
    { min: 0, max: 100000, format: v => `${v/1000}k` },
    { min: 0, max: 100, format: v => `${v}%` },
  ],
  series: [
    {
      name: 'Revenue',
      color: '#3b82f6',
      type: 'bar',
      yAxisIndex: 0,
      data: actualRevenue,
    },
    {
      name: 'Revenue (forecast)',
      color: '#3b82f6',
      type: 'bar',
      yAxisIndex: 0,
      data: forecastRevenue,
      bar: { opacity: 0.35 },
    },
    {
      name: 'Utilization',
      color: '#10b981',
      type: 'line',
      yAxisIndex: 1,
      data: actualUtil,
      line: { width: 2.5 },
      point: { radius: 0 },
      showArea: false,
    },
    {
      name: 'Utilization (forecast)',
      color: '#10b981',
      type: 'line',
      yAxisIndex: 1,
      data: forecastUtil,
      line: { width: 2.5, dashArray: '4 4' },
      point: { radius: 0 },
      showArea: false,
    },
  ],
  annotations: [
    { type: 'region', x: 'Uge 1', x2: 'Uge 12', backgroundColor: 'rgba(0,0,0,0.03)' },
    { type: 'verticalLine', x: 'Uge 52', dashArray: '4 4', label: 'Nu' },
  ],
  legend: { position: 'top' },
  padding: { right: 60 },
});
```

## Bundle Size

| Format | Size |
|--------|------|
| Minified | 21 KB |
| Gzipped | **8.5 KB** |

## Browser Support

Modern browsers with ES2022 support:
- Chrome 94+
- Firefox 93+
- Safari 15+
- Edge 94+

## License

MIT
