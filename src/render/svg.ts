const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {}
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  setAttributes(el, attrs);
  return el;
}

export function setAttributes(
  el: SVGElement,
  attrs: Record<string, string | number>
): void {
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
}

export function createSvgRoot(width: number, height: number): SVGSVGElement {
  return createSvgElement('svg', {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
  });
}

export function createGradient(
  id: string,
  color: string,
  startOpacity: number,
  endOpacity: number,
  startOffset: string,
  endOffset: string
): SVGLinearGradientElement {
  const gradient = createSvgElement('linearGradient', {
    id,
    x1: '0',
    y1: '0',
    x2: '0',
    y2: '1',
  });

  const stop1 = createSvgElement('stop', {
    offset: startOffset,
    'stop-color': color,
    'stop-opacity': startOpacity,
  });

  const stop2 = createSvgElement('stop', {
    offset: endOffset,
    'stop-color': color,
    'stop-opacity': endOpacity,
  });

  gradient.appendChild(stop1);
  gradient.appendChild(stop2);

  return gradient;
}

export function createPath(
  d: string,
  attrs: Record<string, string | number> = {}
): SVGPathElement {
  return createSvgElement('path', { d, ...attrs });
}

export function createLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  attrs: Record<string, string | number> = {}
): SVGLineElement {
  return createSvgElement('line', { x1, y1, x2, y2, ...attrs });
}

export function createCircle(
  cx: number,
  cy: number,
  r: number,
  attrs: Record<string, string | number> = {}
): SVGCircleElement {
  return createSvgElement('circle', { cx, cy, r, ...attrs });
}

export function createText(
  x: number,
  y: number,
  content: string,
  attrs: Record<string, string | number> = {}
): SVGTextElement {
  const text = createSvgElement('text', { x, y, ...attrs });
  text.textContent = content;
  return text;
}

export function createRect(
  x: number,
  y: number,
  width: number,
  height: number,
  attrs: Record<string, string | number> = {}
): SVGRectElement {
  return createSvgElement('rect', { x, y, width, height, ...attrs });
}

export function createDefs(): SVGDefsElement {
  return createSvgElement('defs', {});
}
