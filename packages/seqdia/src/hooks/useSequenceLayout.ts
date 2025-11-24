import { useMemo } from "react";
import { computeLayout, type SequenceLayout, type VisibleActor } from "../lib/sequence/layout";
import { COLUMN_WIDTH } from "../lib/constants";
import { type SequenceController } from "./useSequenceController";
import { type SequenceDiagramModel } from "../lib/sequence/types";
import { softColor } from "../lib/utils";

export type ResolvedMessage = {
  message: SequenceDiagramModel["messages"][number];
  y: number;
  fromResolved: { anchor: number; actorId: string };
  toResolved: { anchor: number; actorId: string };
  fromX: number;
  toX: number;
  direction: 1 | -1;
};

export type LayoutData = {
  layout: SequenceLayout;
  actorColors: Record<string, string>;
  actorBackgrounds: Record<string, string>;
  resolvedMessages: ResolvedMessage[];
  activeActors: Set<string>;
};

export function useSequenceLayout(
  model: SequenceDiagramModel,
  controller: SequenceController,
): LayoutData {
  const layout = useMemo(
    () =>
      computeLayout(model, {
        expandedActorIds: controller.state.expandedActors,
      }),
    [controller.state.expandedActors, model],
  );

  const actorColors = useMemo(() => {
    const map: Record<string, string> = {};
    const ids = layout.visibleActors.map((actor) => actor.actorId);
    ids.forEach((id, idx) => {
      const hue = ((hashId(id) + idx * 5) % 360).toFixed(1);
      map[id] = `hsl(${hue} 72% 52%)`;
    });
    return map;
  }, [layout.visibleActors]);

  const actorBackgrounds = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(actorColors).forEach(([id, color]) => {
      map[id] = softColor(color, 99.4);
    });
    return map;
  }, [actorColors]);

  const leafByStart = useMemo(() => {
    const map = new Map<number, VisibleActor>();
    layout.visibleActors
      .filter((actor) => actor.isLeaf)
      .forEach((actor) => map.set(actor.leafStart, actor));
    return map;
  }, [layout.visibleActors]);

  const leafByEnd = useMemo(() => {
    const map = new Map<number, VisibleActor>();
    layout.visibleActors
      .filter((actor) => actor.isLeaf)
      .forEach((actor) => map.set(actor.leafEnd, actor));
    return map;
  }, [layout.visibleActors]);

  const resolveEndpoint = useMemo(
    () =>
      (
        actorId: string,
        toward: "left" | "right",
      ): { anchor: number; actorId: string } => {
        const actor = layout.visibleActorMap[actorId];
        if (actor && actor.hasChildren && actor.expanded) {
          const leaf =
            toward === "right"
              ? leafByEnd.get(actor.leafEnd)
              : leafByStart.get(actor.leafStart);
          if (leaf) {
            return {
              anchor: layout.anchors[leaf.actorId] * COLUMN_WIDTH,
              actorId: leaf.actorId,
            };
          }
        }
        const span = layout.spans[actorId];
        const width = span.end - span.start;
        if (width > 1) {
          const anchor =
            toward === "right" ? span.end * COLUMN_WIDTH : span.start * COLUMN_WIDTH;
          return { anchor, actorId };
        }
        return { anchor: layout.anchors[actorId] * COLUMN_WIDTH, actorId };
      },
    [layout.anchors, layout.spans, layout.visibleActorMap, leafByEnd, leafByStart],
  );

  const resolvedMessages = useMemo(() => {
    const last = new Map<string, number>();
    return layout.messages.map(({ message, y }) => {
      const toAnchor = layout.anchors[message.toActorId] * COLUMN_WIDTH;
      const directionHint =
        toAnchor >= (layout.anchors[message.fromActorId] ?? 0) ? 1 : -1;
      const fromResolved = resolveEndpoint(
        message.fromActorId,
        directionHint > 0 ? "right" : "left",
      );
      const toResolved = resolveEndpoint(
        message.toActorId,
        directionHint > 0 ? "left" : "right",
      );
      const previousFrom = last.get(fromResolved.actorId);
      const fromX = previousFrom ?? fromResolved.anchor;
      const toX = toResolved.anchor;
      const direction: 1 | -1 = toX >= fromX ? 1 : -1;
      last.set(toResolved.actorId, toX);
      return {
        message,
        y,
        fromResolved,
        toResolved,
        fromX,
        toX,
        direction,
      };
    });
  }, [layout.anchors, layout.messages, resolveEndpoint]);

  const activeActors = useMemo(() => {
    const set = new Set<string>();
    resolvedMessages.forEach((entry) => {
      set.add(entry.fromResolved.actorId);
      set.add(entry.toResolved.actorId);
    });
    return set;
  }, [resolvedMessages]);

  return {
    layout,
    actorColors,
    actorBackgrounds,
    resolvedMessages,
    activeActors,
  };
}

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return (hash + 360) % 360;
}
