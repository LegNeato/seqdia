import { type ActorAlignment, type ActorNode, type SequenceDiagramModel, type SequenceMessage } from "./types";

export type VisibleActor = {
  actorId: string;
  label: string;
  depth: number;
  parentActorId: string | null;
  children: VisibleActor[];
  hasChildren: boolean;
  expanded: boolean;
  alignment: ActorAlignment;
  leafStart: number;
  leafEnd: number;
  leafSpan: number;
  anchor: number;
  isLeaf: boolean;
  className?: string;
  regionClassName?: string;
};

export type PositionedMessage = {
  message: SequenceMessage;
  rowIndex: number;
  y: number;
};

export type SequenceLayout = {
  headerRows: VisibleActor[][];
  visibleActors: VisibleActor[];
  visibleActorMap: Record<string, VisibleActor>;
  leafCount: number;
  anchors: Record<string, number>;
  spans: Record<string, { start: number; end: number }>;
  messages: PositionedMessage[];
  headerHeight: number;
  messageAreaHeight: number;
  totalHeight: number;
  rowHeight: number;
  headerRowHeight: number;
};

export type LayoutOptions = {
  expandedActorIds?: Set<string> | string[];
  headerRowHeight?: number;
  messageRowHeight?: number;
  messageRowPadding?: number;
};

type NormalizedActor = ActorNode & {
  depth: number;
  parentActorId: string | null;
  children: NormalizedActor[];
};

function toSet(values?: Set<string> | string[]) {
  if (!values) return undefined;
  return values instanceof Set ? values : new Set(values);
}

function normalizeActors(
  actors: ActorNode[],
  parentActorId: string | null = null,
  depth = 0,
): NormalizedActor[] {
  return actors.map((actor) => ({
    ...actor,
    parentActorId: parentActorId ?? actor.parentActorId ?? null,
    depth,
    children: normalizeActors(actor.children ?? [], actor.actorId, depth + 1),
  }));
}

function deriveExpandedActorIds(
  actors: NormalizedActor[],
  expandedActorIds?: Set<string>,
): Set<string> {
  if (expandedActorIds) return expandedActorIds;

  const result = new Set<string>();
  const walk = (nodes: NormalizedActor[]) => {
    nodes.forEach((node) => {
      const hasChildren = node.children.length > 0;
      if (hasChildren && (node.defaultExpanded ?? true)) {
        result.add(node.actorId);
      }
      walk(node.children);
    });
  };
  walk(actors);
  return result;
}

function computeVisibleActors(
  actors: NormalizedActor[],
  expanded: Set<string>,
  headerRows: VisibleActor[][],
  leafCounter: { value: number },
  ancestorExpanded: boolean,
): VisibleActor[] {
  const visible: VisibleActor[] = [];

  actors.forEach((node) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = ancestorExpanded && hasChildren && expanded.has(node.actorId);
    const childVisible = isExpanded
      ? computeVisibleActors(node.children, expanded, headerRows, leafCounter, true)
      : [];

    const leafStart = childVisible.length ? childVisible[0].leafStart : leafCounter.value++;
    const leafEnd = childVisible.length
      ? childVisible[childVisible.length - 1].leafEnd
      : leafStart;
    const leafSpan = leafEnd - leafStart + 1;
    const startBoundary = leafStart;
    const endBoundary = leafEnd + 1;
    const alignment: ActorAlignment = node.alignment ?? "center";
    const anchor =
      alignment === "left"
        ? startBoundary
        : alignment === "right"
          ? endBoundary
          : (startBoundary + endBoundary) / 2;

    const visibleNode: VisibleActor = {
      actorId: node.actorId,
      label: node.label,
      depth: node.depth,
      parentActorId: node.parentActorId ?? null,
      children: childVisible,
      hasChildren,
      expanded: isExpanded,
      alignment,
      leafStart,
      leafEnd,
      leafSpan,
      anchor,
      isLeaf: childVisible.length === 0,
      className: node.className,
      regionClassName: node.regionClassName,
    };

    headerRows[visibleNode.depth] = headerRows[visibleNode.depth] ?? [];
    headerRows[visibleNode.depth].push(visibleNode);

    visible.push(visibleNode, ...childVisible);
  });

  return visible;
}

function filterMessages(
  messages: SequenceMessage[],
  visibleActorMap: Record<string, VisibleActor>,
): SequenceMessage[] {
  return messages.filter(
    (message) =>
      Boolean(visibleActorMap[message.fromActorId]) &&
      Boolean(visibleActorMap[message.toActorId]),
  );
}

export function computeLayout(
  model: SequenceDiagramModel,
  options: LayoutOptions = {},
): SequenceLayout {
  const headerRowHeight = options.headerRowHeight ?? 56;
  const rowHeight = options.messageRowHeight ?? 76;
  const rowPadding = options.messageRowPadding ?? 18;

  const normalizedActors = normalizeActors(model.actors);
  const expandedActors = deriveExpandedActorIds(
    normalizedActors,
    toSet(options.expandedActorIds),
  );

  const headerRows: VisibleActor[][] = [];
  const leafCounter = { value: 0 };
  const visibleActors = computeVisibleActors(
    normalizedActors,
    expandedActors,
    headerRows,
    leafCounter,
    true,
  );

  const leafCount = Math.max(leafCounter.value, 1);
  const visibleActorMap = visibleActors.reduce<Record<string, VisibleActor>>(
    (acc, actor) => {
      acc[actor.actorId] = actor;
      return acc;
    },
    {},
  );

  const anchors = visibleActors.reduce<Record<string, number>>((acc, actor) => {
    acc[actor.actorId] = actor.anchor;
    return acc;
  }, {});

  const spans = visibleActors.reduce<Record<string, { start: number; end: number }>>(
    (acc, actor) => {
      acc[actor.actorId] = { start: actor.leafStart, end: actor.leafEnd + 1 };
      return acc;
    },
    {},
  );

  const visibleMessages = filterMessages(model.messages, visibleActorMap);
  const annotatedMessages = visibleMessages.map((message, idx) => ({
    message,
    order: idx,
    hint: message.rowIndex ?? idx,
  }));

  annotatedMessages.sort((a, b) => {
    if (a.hint === b.hint) return a.order - b.order;
    return a.hint - b.hint;
  });

  const messages: PositionedMessage[] = annotatedMessages.map(
    (item, denseIndex) => ({
      message: item.message,
      rowIndex: denseIndex,
      y: rowPadding + denseIndex * rowHeight,
    }),
  );

  const messageAreaHeight =
    messages.length > 0
      ? rowPadding * 2 + messages.length * rowHeight
      : rowPadding * 2 + rowHeight;

  const maxDepth = headerRows.length ? headerRows.length - 1 : 0;
  const headerHeight = (maxDepth + 1) * headerRowHeight;
  const totalHeight = headerHeight + messageAreaHeight;

  return {
    headerRows,
    visibleActors,
    visibleActorMap,
    leafCount,
    anchors,
    spans,
    messages,
    headerHeight,
    messageAreaHeight,
    totalHeight,
    rowHeight,
    headerRowHeight,
  };
}
