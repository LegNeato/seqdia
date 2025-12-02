import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function softColor(color: string, lightness: number) {
  const match = /hsl\(\s*([-\d.]+)\s+([-\d.]+)%\s+([-\d.]+)%/.exec(color);
  if (!match) return color;
  const [, h, s] = match;
  const safeLightness = Math.min(Math.max(lightness, 0), 100);
  const safeSat = Math.min(Math.max(parseFloat(s), 0), 100);
  return `hsl(${parseFloat(h)} ${safeSat}% ${safeLightness}%)`;
}

import type { ActorNode } from "./sequence/types";

export function collectActorIds(nodes: readonly ActorNode[]): string[] {
  return nodes.flatMap((node) => [
    node.actorId,
    ...collectActorIds(node.children ?? []),
  ]);
}

/**
 * Convert a normalized anchor (in column units) to pixels.
 * @param anchor - Anchor value from layout (0 to leafCount)
 * @param columnWidth - Width of each column in pixels
 */
export function anchorToPixels(anchor: number, columnWidth: number): number {
  return anchor * columnWidth;
}

/**
 * Convert a normalized anchor to a percentage (0-100).
 * Useful for fluid/responsive layouts.
 * Anchors are centered in columns (0.5, 1.5, 2.5, ...) so we offset by 0.5.
 * @param anchor - Anchor value from layout (0.5 to leafCount-0.5)
 * @param leafCount - Total number of leaf actors
 */
export function anchorToPercent(anchor: number, leafCount: number): number {
  if (leafCount <= 1) return 50; // Center single actor
  return ((anchor - 0.5) / (leafCount - 1)) * 100;
}
