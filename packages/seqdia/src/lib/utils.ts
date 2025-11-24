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
