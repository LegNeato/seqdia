import { useMemo } from "react";
import { computeLayout, type SequenceLayout, type VisibleActor } from "../lib/sequence/layout";
import { type SequenceController } from "./useSequenceController";
import { type SequenceDiagramModel } from "../lib/sequence/types";

/**
 * A resolved message with normalized position values.
 * All position values (anchor, fromAnchor, toAnchor) are in column units (0 to leafCount).
 * Consumers can convert to pixels (multiply by columnWidth) or percentages (divide by leafCount).
 */
export type ResolvedMessage = {
  message: SequenceDiagramModel["messages"][number];
  /** Row index (0-based) */
  rowIndex: number;
  /** Normalized anchor of the source actor (in column units) */
  fromAnchor: number;
  /** Normalized anchor of the target actor (in column units) */
  toAnchor: number;
  /** Actor ID of the resolved source */
  fromActorId: string;
  /** Actor ID of the resolved target */
  toActorId: string;
  /** Direction: 1 for left-to-right, -1 for right-to-left */
  direction: 1 | -1;
};

export type LayoutData = {
  layout: SequenceLayout;
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

  /**
   * Resolves an actor ID to its anchor position (in column units).
   * For expanded parent actors, resolves to the appropriate leaf child.
   */
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
              anchor: layout.anchors[leaf.actorId],
              actorId: leaf.actorId,
            };
          }
        }
        const span = layout.spans[actorId];
        const width = span.end - span.start;
        if (width > 1) {
          const anchor = toward === "right" ? span.end : span.start;
          return { anchor, actorId };
        }
        return { anchor: layout.anchors[actorId], actorId };
      },
    [layout.anchors, layout.spans, layout.visibleActorMap, leafByEnd, leafByStart],
  );

  const resolvedMessages = useMemo(() => {
    const last = new Map<string, number>();
    return layout.messages.map(({ message, rowIndex }) => {
      const toAnchor = layout.anchors[message.toActorId];
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
      const fromAnchor = previousFrom ?? fromResolved.anchor;
      const toAnchorResolved = toResolved.anchor;
      const direction: 1 | -1 = toAnchorResolved >= fromAnchor ? 1 : -1;
      last.set(toResolved.actorId, toAnchorResolved);
      return {
        message,
        rowIndex,
        fromAnchor,
        toAnchor: toAnchorResolved,
        fromActorId: fromResolved.actorId,
        toActorId: toResolved.actorId,
        direction,
      };
    });
  }, [layout.anchors, layout.messages, resolveEndpoint]);

  const activeActors = useMemo(() => {
    const set = new Set<string>();
    resolvedMessages.forEach((entry) => {
      set.add(entry.fromActorId);
      set.add(entry.toActorId);
    });
    return set;
  }, [resolvedMessages]);

  return {
    layout,
    resolvedMessages,
    activeActors,
  };
}
