import {
  type ActorNode,
  type SequenceDiagramModel,
  type VisibleMessage,
} from "./types";

type VisibleState = {
  actorMap: Map<string, ActorNode>;
  leafByStart: Map<string, ActorNode>;
  leafByEnd: Map<string, ActorNode>;
};

function buildVisibleState(actors: readonly ActorNode[]): VisibleState {
  const actorMap = new Map<string, ActorNode>();
  const leafByStart = new Map<string, ActorNode>();
  const leafByEnd = new Map<string, ActorNode>();

  const walk = (
    nodes: readonly ActorNode[],
    startIndex: { value: number },
    endIndex: { value: number },
  ) => {
    nodes.forEach((node) => {
      actorMap.set(node.actorId, node);
      const hasChildren = Boolean(node.children && node.children.length);
      if (hasChildren) {
        walk(node.children ?? [], startIndex, endIndex);
      } else {
        startIndex.value += 1;
        endIndex.value += 1;
        leafByStart.set(node.actorId, node);
        leafByEnd.set(node.actorId, node);
      }
    });
  };

  walk(actors, { value: 0 }, { value: 0 });

  return { actorMap, leafByStart, leafByEnd };
}

/**
 * Derive visible messages between leaves, optionally rolling up to a parent.
 */
export function deriveVisibleMessages(
  model: SequenceDiagramModel,
  expandedActors: Set<string>,
): VisibleMessage[] {
  const state = buildVisibleState(model.actors);

  const resolve = (actorId: string, toward: "left" | "right") => {
    const actor = state.actorMap.get(actorId);
    if (actor && actor.children && actor.children.length && expandedActors.has(actorId)) {
      const leaf = toward === "right"
        ? actor.children[actor.children.length - 1]
        : actor.children[0];
      return resolve(leaf.actorId, toward);
    }
    return actorId;
  };

  return model.messages.map((message) => {
    const fromLeaf = resolve(message.fromActorId, "left");
    const toLeaf = resolve(message.toActorId, "right");
    if (fromLeaf === message.fromActorId && toLeaf === message.toActorId) {
      return { kind: "leaf", message } as VisibleMessage;
    }
    return {
      kind: "rolled",
      message,
      fromLeafActorId: fromLeaf,
      toLeafActorId: toLeaf,
    } as VisibleMessage;
  });
}
