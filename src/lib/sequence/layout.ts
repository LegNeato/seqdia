import { scaleLinear, scalePoint } from "d3-scale";
import { type Sequence } from "./types";

export type SequenceLayout = {
  actorPositions: Record<string, number>;
  messagePositions: Record<
    string,
    { y: number; fromX: number; toX: number; kind: string }
  >;
  height: number;
  spacing: number;
};

type LayoutOptions = {
  height?: number;
  spacing?: number;
};

export function computeLayout(
  sequence: Sequence,
  options: LayoutOptions = {},
): SequenceLayout {
  const spacing = options.spacing ?? 96;
  const actorIds = sequence.actors.map((actor) => actor.id);
  const x = scalePoint(actorIds, [0, 100]).padding(0.3);

  const actorPositions = actorIds.reduce<Record<string, number>>((acc, id) => {
    const value = x(id);
    acc[id] = value === undefined ? 0 : value;
    return acc;
  }, {});

  const y = scaleLinear()
    .domain([0, Math.max(sequence.messages.length - 1, 1)])
    .range([0, Math.max(sequence.messages.length - 1, 1) * spacing]);

  const messagePositions = sequence.messages.reduce<
    SequenceLayout["messagePositions"]
  >((acc, message, index) => {
    acc[message.id] = {
      y: y(index),
      fromX: actorPositions[message.from] ?? 0,
      toX: actorPositions[message.to] ?? 0,
      kind: message.kind ?? "sync",
    };
    return acc;
  }, {});

  const height =
    options.height ??
    (sequence.messages.length ? y(sequence.messages.length) + spacing : 240);

  return {
    actorPositions,
    messagePositions,
    height,
    spacing,
  };
}
