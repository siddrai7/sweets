import { Fragment, isValidElement, type ReactNode } from 'react';

/** SVG attributes that keep their camelCase spelling; everything else is kebab-cased. */
const KEEP = new Set([
  'viewBox',
  'preserveAspectRatio',
  'patternUnits',
  'gradientUnits',
  'gradientTransform',
]);

const attrName = (k: string) =>
  k === 'className' ? 'class' : KEEP.has(k) ? k : k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Renders a tree of plain SVG elements and hook-free function components to markup.
 * App Router modules can't import react-dom/server, and the illustrations are static, so a
 * tiny serializer is enough.
 */
export function svgToString(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return esc(String(node));
  if (Array.isArray(node)) return node.map(svgToString).join('');
  if (!isValidElement(node)) return '';
  const { type, props } = node as { type: unknown; props: Record<string, unknown> };
  if (type === Fragment) return svgToString(props.children as ReactNode);
  if (typeof type === 'function') return svgToString((type as (p: unknown) => ReactNode)(props));
  if (typeof type !== 'string') return '';
  const attrs = Object.entries(props)
    .filter(([k, v]) => k !== 'children' && v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${attrName(k)}="${esc(String(v === true ? '' : v))}"`)
    .join('');
  const children = svgToString(props.children as ReactNode);
  return children ? `<${type}${attrs}>${children}</${type}>` : `<${type}${attrs}/>`;
}
