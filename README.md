# SWP Charting

A lightweight, zero-dependency SVG charting library for TypeScript/JavaScript.

**8.8 KB** gzipped — 8x smaller than Chart.js

## Features

- **Lightweight** — No dependencies, tiny bundle size
- **TypeScript** — Full type definitions included
- **Line, Bar & Pie Charts** — Smooth curves, grouped bars, pie/donut charts
- **Smooth curves** — Monotone cubic spline (Fritsch-Carlson) prevents overshoot
- **Responsive** — Auto-resize with ResizeObserver
- **Interactive** — Hover tooltips with smooth animations
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
| `yAxis` | `YAxisConfig` | auto | Y-axis configuration |
| `tooltip` | `boolean \| TooltipConfig` | `true` | Tooltip settings |
| `legend` | `boolean \| LegendConfig` | `false` | Legend settings |
| `animation` | `boolean \| AnimationConfig` | `true` | Load animation |
| `padding` | `Padding` | `{ top: 30, right: 40, bottom: 40, left: 60 }` | Chart padding |

### Series Configuration

```typescript
{
  name: 'Sales',
  color: '#8b5cf6',
  data: [{ x: 'Jan', y: 100 }, { x: 'Feb', y: 200 }],
  type: 'line',           // 'line' | 'bar' | 'pie' (default: 'line')
  unit: 'kr',             // Unit suffix for values in tooltips/legend (optional)

  // Line style (for type: 'line')
  line: {
    width: 2.5,           // Line thickness
    curve: 'smooth',      // 'smooth' | 'linear'
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
{
  yAxis: {
    min: 0,
    max: 1000,
    ticks: 5,
    format: (v) => v.toLocaleString('da-DK') + ' kr'
  }
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

## Examples

### Smooth Curves (Default)

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

### Linear Lines with Dot Points

```typescript
createChart(el, {
  xAxis: { categories: months },
  series: [{
    name: 'Revenue',
    color: '#10b981',
    data: [...],
    line: { curve: 'linear', width: 2 },
    point: { style: 'dot', radius: 4 },
    showArea: false
  }]
});
```

### Multiple Series with Sparse Data

```typescript
createChart(el, {
  xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
  series: [
    {
      name: 'Team A',
      color: '#3b82f6',
      data: [{ x: 'Feb', y: 200 }, { x: 'May', y: 450 }]
    },
    {
      name: 'Team B',
      color: '#ef4444',
      data: [{ x: 'Jan', y: 150 }, { x: 'Apr', y: 320 }]
    }
  ],
  legend: true
});
```

### Fixed Size Chart

```typescript
createChart(el, {
  width: 620,
  height: 215,
  xAxis: { categories: months },
  series: [...]
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
  yAxis: { format: (v) => v + ' kr' },
  legend: true
});
```

### Grouped Bar Chart

```typescript
createChart(el, {
  xAxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
  series: [
    {
      name: '2023',
      color: '#3b82f6',
      type: 'bar',
      data: [
        { x: 'Q1', y: 320 },
        { x: 'Q2', y: 450 },
        { x: 'Q3', y: 280 },
        { x: 'Q4', y: 520 },
      ]
    },
    {
      name: '2024',
      color: '#10b981',
      type: 'bar',
      data: [
        { x: 'Q1', y: 420 },
        { x: 'Q2', y: 580 },
        { x: 'Q3', y: 350 },
        { x: 'Q4', y: 720 },
      ]
    }
  ],
  legend: { position: 'top', align: 'end' }
});
```

### Pie Chart

```typescript
createChart(el, {
  width: 400,
  height: 300,
  series: [
    { name: 'Produkter', color: '#8b5cf6', type: 'pie', data: [{ x: '', y: 350 }] },
    { name: 'Services', color: '#3b82f6', type: 'pie', data: [{ x: '', y: 280 }] },
    { name: 'Licenser', color: '#10b981', type: 'pie', data: [{ x: '', y: 180 }] },
    { name: 'Support', color: '#f59e0b', type: 'pie', data: [{ x: '', y: 120 }] },
  ],
  legend: true
});
```

### Donut Chart

```typescript
createChart(el, {
  width: 450,
  height: 300,
  series: [
    { name: 'Q1', color: '#8b5cf6', type: 'pie', data: [{ x: '', y: 420 }], pie: { innerRadius: 40 } },
    { name: 'Q2', color: '#3b82f6', type: 'pie', data: [{ x: '', y: 580 }], pie: { innerRadius: 40 } },
    { name: 'Q3', color: '#10b981', type: 'pie', data: [{ x: '', y: 350 }], pie: { innerRadius: 40 } },
    { name: 'Q4', color: '#f59e0b', type: 'pie', data: [{ x: '', y: 720 }], pie: { innerRadius: 40 } },
  ],
  legend: { position: 'right', align: 'center' }
});
```

### Pie Chart with Breakdown

Use multiple data points per series to show breakdown details in tooltip:

```typescript
createChart(el, {
  width: 400,
  height: 300,
  series: [
    {
      name: 'Syg',
      color: '#ef4444',
      type: 'pie',
      unit: 't',
      data: [
        { x: 'Henrik', y: 2 },
        { x: 'Peter', y: 10 },
      ]
    },
    {
      name: 'Ferie',
      color: '#3b82f6',
      type: 'pie',
      unit: 't',
      data: [
        { x: 'Henrik', y: 5 },
        { x: 'Peter', y: 3 },
      ]
    },
  ],
  legend: true,
  tooltip: { fontSize: 14 }
});
```

Legend shows: `Syg 12 t`, `Ferie 8 t`

Tooltip on hover shows breakdown:
```
Syg
12 t (60.0%)
  Henrik: 2 t
  Peter: 10 t
```

### Dual Y-Axis

```typescript
createChart(el, {
  xAxis: { categories: ['Jan', 'Feb', 'Mar'] },
  yAxis: [
    { min: 0, max: 100000, format: (v) => `${v/1000}k` },  // Left axis
    { min: 0, max: 100, format: (v) => `${v}%` },          // Right axis
  ],
  series: [
    { name: 'Revenue', color: '#3b82f6', type: 'bar', yAxisIndex: 0, data: [...] },
    { name: 'Utilization', color: '#10b981', type: 'line', yAxisIndex: 1, data: [...] },
  ],
});
```

### Dashed Lines

```typescript
{
  name: 'Forecast',
  color: '#10b981',
  type: 'line',
  line: { dashArray: '5,5' },  // Creates dashed line
  data: [...]
}
```

### Annotations (Vertical Lines)

```typescript
createChart(el, {
  // ... series and axes
  annotations: [
    {
      type: 'verticalLine',
      x: 'Mar',              // Category name or index
      color: '#666',
      label: 'Nu',
      labelPosition: 'top',  // 'top' | 'bottom'
    }
  ],
});
```

### Revenue/Utilization/Budget Combo Chart

Pre-built combo chart for business metrics:

```typescript
import { createChart, createRevenueUtilizationBudgetChart } from '@sevenweirdpeople/swp-charting';

const data = [
  { time: 'Uge 48', index: -2, revenue: 45000, budget: 50000, utilization: 0.75, isForecast: false },
  { time: 'Uge 49', index: -1, revenue: 52000, budget: 50000, utilization: 0.82, isForecast: false },
  { time: 'Uge 50', index: 0, revenue: 55000, budget: 52000, utilization: 0.85, isForecast: false },
  { time: 'Uge 51', index: 1, revenue: 60000, budget: 55000, utilization: 0.90, isForecast: true },
  { time: 'Uge 52', index: 2, revenue: 58000, budget: 55000, utilization: 0.88, isForecast: true },
];

const options = createRevenueUtilizationBudgetChart(data, {
  width: 700,
  height: 400,
  showLegend: true,
  nowLabel: 'Nu',
});

createChart(document.getElementById('chart'), options);
```

Features:
- Revenue as bars (left Y-axis, DKK)
- Utilization as line (right Y-axis, 0-100%)
- Budget as line (left Y-axis, DKK)
- Solid lines/bars for actual, dashed/transparent for forecast
- Vertical "Now" line at index = 0

## Bundle Size

| Format | Size |
|--------|------|
| Uncompressed | 47 KB |
| Gzipped | **11 KB** |

## Browser Support

Modern browsers with ES2022 support:
- Chrome 94+
- Firefox 93+
- Safari 15+
- Edge 94+

## License

MIT
