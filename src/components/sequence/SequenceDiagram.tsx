"use client";

import { useMemo, type ReactNode } from "react";
import { ChevronDown, ChevronUp, GitCompare, ArrowRight } from "lucide-react";

import {
  SequenceProvider,
  useSequenceContext,
} from "@/components/sequence/SequenceProvider";
import { useSequenceApi } from "@/hooks/useSequenceApi";
import {
  type SequenceController,
  type SequenceControllerApi,
} from "@/hooks/useSequenceController";
import { computeLayout, type SequenceLayout } from "@/lib/sequence/layout";
import { cn } from "@/lib/utils";
import type {
  Sequence,
  SequenceActor,
  SequenceMessage,
} from "@/lib/sequence/types";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";

type ViewSequence = Sequence & { actors: SequenceActor[]; messages: SequenceMessage[] };

type ExpandResult = {
  sequence: ViewSequence;
  entryId?: string;
};

const ACTOR_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(173, 58%, 39%)",
  "hsl(43, 96%, 50%)",
  "hsl(12, 83%, 58%)",
  "hsl(280, 65%, 60%)",
  "hsl(195, 74%, 52%)",
  "hsl(140, 65%, 45%)",
  "hsl(330, 70%, 55%)",
];

function expandSequenceView(
  sequence: Sequence,
  collapsedActors: Set<string>,
  prefix = "",
): ExpandResult {
  const actors: SequenceActor[] = [];
  const messages: SequenceMessage[] = [];
  const actorIdMap: Record<string, string> = {};

  sequence.actors.forEach((actor) => {
    if (actor.embeddedSequence && !collapsedActors.has(actor.id)) {
      const expanded = expandSequenceView(
        actor.embeddedSequence,
        collapsedActors,
        `${prefix}${actor.id}.`,
      );
      const entryId =
        expanded.sequence.actors[0]?.id ?? `${prefix}${actor.id}`;
      actorIdMap[actor.id] = entryId;
      expanded.sequence.actors.forEach((child) => {
        actors.push({
          ...child,
          parentId: actor.id,
          originId: child.originId ?? child.id,
        });
      });
      expanded.sequence.messages.forEach((message) => {
        messages.push({
          ...message,
          parentId: actor.id,
          originId: message.originId ?? message.id,
        });
      });
    } else {
      const id = `${prefix}${actor.id}`;
      actorIdMap[actor.id] = id;
      actors.push({
        ...actor,
        id,
        originId: actor.originId ?? actor.id,
      });
    }
  });

  sequence.messages.forEach((message) => {
    const from = actorIdMap[message.from] ?? `${prefix}${message.from}`;
    const to = actorIdMap[message.to] ?? `${prefix}${message.to}`;
    messages.push({
      ...message,
      id: `${prefix}${message.id}`,
      originId: message.originId ?? message.id,
      from,
      to,
    });
  });

  return {
    sequence: {
      ...sequence,
      actors,
      messages,
    },
    entryId: actors[0]?.id,
  };
}

type SequenceDiagramProps = {
  sequence: Sequence;
  controller?: SequenceController;
  height?: number;
  className?: string;
  showLegend?: boolean;
  onReady?: (api: SequenceControllerApi) => void;
  renderActorLabel?: (actor: SequenceActor) => React.ReactNode;
  renderMessageClass?: (
    messageClass: string,
    message: SequenceMessage,
  ) => React.ReactNode;
  renderMeta?: (
    meta: Record<string, string | number>,
    message: SequenceMessage,
  ) => React.ReactNode;
};

export function SequenceDiagram({
  sequence,
  controller,
  height = 520,
  className,
  showLegend = true,
  onReady,
  renderActorLabel,
  renderMessageClass,
  renderMeta,
}: SequenceDiagramProps) {
  return (
    <SequenceProvider sequence={sequence} controller={controller}>
      <SequenceSurface
        height={height}
        className={className}
        showLegend={showLegend}
        onReady={onReady}
        renderActorLabel={renderActorLabel}
        renderMessageClass={renderMessageClass}
        renderMeta={renderMeta}
      />
    </SequenceProvider>
  );
}

type SurfaceProps = {
  height: number;
  showLegend: boolean;
  onReady?: (api: SequenceControllerApi) => void;
  className?: string;
  renderActorLabel?: (actor: SequenceActor) => ReactNode;
  renderMessageClass?: (
    messageClass: string,
    message: SequenceMessage,
  ) => ReactNode;
  renderMeta?: (
    meta: Record<string, string | number>,
    message: SequenceMessage,
  ) => ReactNode;
};

function SequenceSurface({
  height,
  showLegend,
  onReady,
  className,
  renderActorLabel,
  renderMessageClass,
  renderMeta,
}: SurfaceProps) {
  const { sequence, controller } = useSequenceContext();
  useSequenceApi(onReady);
  const viewSequence = useMemo(
    () => expandSequenceView(sequence, controller.state.collapsedActors).sequence,
    [controller.state.collapsedActors, sequence],
  );
  const actorIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    viewSequence.actors.forEach((actor, index) => {
      map[actor.id] = index;
    });
    return map;
  }, [viewSequence.actors]);
  const actorCount = viewSequence.actors.length || 1;
  const columnTemplate = useMemo(
    () => `repeat(${actorCount}, minmax(140px, 1fr))`,
    [actorCount],
  );
  const actorColors = useMemo(() => {
    const originOrder = new Map<string, number>();
    const colorMap: Record<string, string> = {};
    viewSequence.actors.forEach((actor) => {
      const key = actor.originId ?? actor.id;
      if (!originOrder.has(key)) {
        originOrder.set(key, originOrder.size);
      }
      const idx = originOrder.get(key) ?? 0;
      colorMap[actor.id] = ACTOR_COLORS[idx % ACTOR_COLORS.length];
    });
    return colorMap;
  }, [viewSequence.actors]);
  const layout = useMemo(
    () => computeLayout(viewSequence, { height }),
    [height, viewSequence],
  );
  const messageY = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(layout.messagePositions).forEach(([id, pos]) => {
      map[id] = pos.y;
    });
    return map;
  }, [layout.messagePositions]);

  const uniqueMessageClasses = useMemo(
    () =>
      Array.from(
        new Set(
          viewSequence.messages
            .map((message) => message.messageClass)
            .filter(Boolean) as string[],
        ),
      ),
    [viewSequence.messages],
  );

  const messageClassSamples = useMemo(() => {
    const map: Record<string, SequenceMessage | undefined> = {};
    viewSequence.messages.forEach((message) => {
      if (message.messageClass && !map[message.messageClass]) {
        map[message.messageClass] = message;
      }
    });
    return map;
  }, [viewSequence.messages]);

  const sequenceStyle = controller.state.styles.sequences[sequence.id];
  const sequenceHighlighted = controller.state.highlight.sequences.has(
    sequence.id,
  );

  return (
    <Card
      className={cn(
        "space-y-2 border-border/80",
        sequenceStyle,
        sequenceHighlighted && "ring-2 ring-primary/50 ring-offset-1",
        className,
      )}
      data-sequence-id={sequence.id}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitCompare className="h-4 w-4 text-primary" />
              {sequence.label ?? "Sequence"}
            </CardTitle>
            {sequence.description && (
              <CardDescription>{sequence.description}</CardDescription>
            )}
          </div>
          {showLegend && (
            <SequenceLegend
              messageClasses={uniqueMessageClasses}
              samples={messageClassSamples}
              renderMessageClass={
                renderMessageClass
                  ? (value) =>
                      renderMessageClass(
                        value,
                        messageClassSamples[value] ?? {
                          id: `legend-${value}`,
                          from: "",
                          to: "",
                          label: value,
                        },
                      )
                  : undefined
              }
            />
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pb-6">
        <SequenceStage
          layout={layout}
          viewSequence={viewSequence}
          renderActorLabel={renderActorLabel}
          renderMessageClass={renderMessageClass}
          renderMeta={renderMeta}
          actorColors={actorColors}
          actorIndexMap={actorIndexMap}
          actorCount={actorCount}
          columnTemplate={columnTemplate}
          messageY={messageY}
        />
      </CardContent>
    </Card>
  );
}

export function SequenceLegend({
  messageClasses,
  renderMessageClass,
  samples,
}: {
  messageClasses: string[];
  renderMessageClass?: (
    messageClass: string,
    sampleMessage?: SequenceMessage,
  ) => ReactNode;
  samples?: Record<string, SequenceMessage | undefined>;
}) {
  if (!messageClasses.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span className="mr-1 font-semibold">Classes</span>
      {messageClasses.map((value) => (
        <div key={value} className="flex items-center gap-1">
          {renderMessageClass ? (
            renderMessageClass(value, samples?.[value])
          ) : (
            <Badge variant="outline">{value}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

export function SequenceStage({
  layout,
  viewSequence,
  renderActorLabel,
  renderMessageClass,
  renderMeta,
  actorColors,
  actorIndexMap,
  actorCount,
  columnTemplate,
  messageY,
}: {
  layout: SequenceLayout;
  viewSequence: ViewSequence;
  renderActorLabel?: (actor: SequenceActor) => ReactNode;
  renderMessageClass?: (
    messageClass: string,
    message: SequenceMessage,
  ) => ReactNode;
  renderMeta?: (
    meta: Record<string, string | number>,
    message: SequenceMessage,
  ) => ReactNode;
  actorColors: Record<string, string>;
  actorIndexMap: Record<string, number>;
  actorCount: number;
  columnTemplate: string;
  messageY: Record<string, number>;
}) {
  const headerHeight = 80;
  const messageOffset = headerHeight + 24;
  const stageMinHeight = messageOffset + layout.height;

  return (
    <div
      className="relative w-full overflow-x-auto"
      style={{ minHeight: stageMinHeight }}
    >
      <div className="min-w-full grid gap-x-6" style={{ gridTemplateColumns: columnTemplate }}>
        <ActorHeader
          renderActorLabel={renderActorLabel}
          actors={viewSequence.actors}
          actorColors={actorColors}
          actorIndexMap={actorIndexMap}
          columnTemplate={columnTemplate}
        />
        <div className="relative" style={{ gridColumn: `1 / span ${actorCount}`, marginTop: messageOffset, height: layout.height }}>
          <div className="absolute inset-0">
            {viewSequence.actors.map((actor) => (
              <ActorLane
                key={actor.id}
                actor={actor}
                color={actorColors[actor.id]}
                actorIndexMap={actorIndexMap}
                actorCount={actorCount}
              />
            ))}
          </div>
          <div className="relative h-full">
            {viewSequence.messages.map((message) => (
              <MessageEdge
                key={message.id}
                message={message}
                sequenceId={viewSequence.id}
                renderMessageClass={renderMessageClass}
                renderMeta={renderMeta}
                color={
                  actorColors[message.from] ??
                  actorColors[message.to] ??
                  ACTOR_COLORS[0]
                }
                actorIndexMap={actorIndexMap}
                actorCount={actorCount}
                messageY={messageY[message.id] ?? 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActorHeader({
  renderActorLabel,
  actors,
  actorColors,
  actorIndexMap,
  columnTemplate,
}: {
  renderActorLabel?: (actor: SequenceActor) => ReactNode;
  actors: SequenceActor[];
  actorColors: Record<string, string>;
  actorIndexMap: Record<string, number>;
  columnTemplate: string;
}) {
  return (
    <div
      className="relative grid items-start"
      style={{ gridTemplateColumns: columnTemplate, rowGap: "4px" }}
    >
      {actors.map((actor) => (
        <div
          key={actor.id}
          className="flex flex-col items-center"
          style={{ gridColumn: (actorIndexMap[actor.id] ?? 0) + 1 }}
        >
          <ActorAnchor
            actor={actor}
            renderActorLabel={renderActorLabel}
            color={actorColors[actor.id]}
          />
        </div>
      ))}
    </div>
  );
}

export function ActorAnchor({
  actor,
  renderActorLabel,
  color,
}: {
  actor: SequenceActor;
  renderActorLabel?: (actor: SequenceActor) => ReactNode;
  color?: string;
}) {
  const { controller } = useSequenceContext();
  const { highlight, styles, collapsedActors } = controller.state;
  const hasChild = Boolean(actor.embeddedSequence);
  const collapsed = collapsedActors.has(actor.id);
  const isHighlighted =
    highlight.actors.has(actor.id) ||
    (actor.originId && highlight.actors.has(actor.originId)) ||
    (actor.parentId && highlight.actors.has(actor.parentId)) ||
    (actor.embeddedSequence &&
      highlight.sequences.has(actor.embeddedSequence.id));

  const actorStyle =
    styles.actors[actor.id] ??
    (actor.originId ? styles.actors[actor.originId] : undefined) ??
    (actor.parentId ? styles.actors[actor.parentId] : undefined);

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <button
        className={cn(
          "flex min-h-8 w-full items-center justify-center gap-2 rounded-md bg-transparent px-2 py-1 text-sm font-semibold transition hover:underline",
          actorStyle,
          actor.className,
          isHighlighted && "text-primary underline",
        )}
        onClick={
          hasChild ? () => controller.api.toggleActor(actor.id) : undefined
        }
        aria-pressed={!collapsed}
        aria-label={`Actor ${actor.label}`}
        data-actor-id={actor.id}
        style={{ borderColor: color ?? undefined, color: color ?? undefined }}
      >
        {renderActorLabel ? (
          renderActorLabel(actor)
        ) : (
          <span className="truncate text-sm font-semibold">{actor.label}</span>
        )}
        {hasChild &&
          (collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ))}
      </button>
      {actor.subtitle && (
        <p className="text-[11px] text-muted-foreground">{actor.subtitle}</p>
      )}
    </div>
  );
}

export function ActorLane({
  actor,
  color,
  actorIndexMap,
  actorCount,
}: {
  actor: SequenceActor;
  color?: string;
  actorIndexMap: Record<string, number>;
  actorCount: number;
}) {
  const { controller } = useSequenceContext();
  const { highlight, styles } = controller.state;
  const isHighlighted =
    highlight.actors.has(actor.id) ||
    (actor.originId && highlight.actors.has(actor.originId)) ||
    (actor.parentId && highlight.actors.has(actor.parentId));
  const actorStyle =
    styles.actors[actor.id] ??
    (actor.originId ? styles.actors[actor.originId] : undefined) ??
    (actor.parentId ? styles.actors[actor.parentId] : undefined);
  const idx = actorIndexMap[actor.id] ?? 0;
  const colWidth = 100 / Math.max(actorCount, 1);
  const x = (idx + 0.5) * colWidth;

  return (
    <div
      className="absolute top-0 flex h-full w-0.5 -translate-x-1/2 transform items-start justify-center"
      style={{ left: `${x}%` }}
    >
      <div
        className={cn(
          "h-full w-0.5 rounded-full bg-border",
          actor.laneClassName,
          actorStyle,
          isHighlighted && "shadow-[0_0_0_2px_rgba(59,130,246,0.35)]",
        )}
        style={{ backgroundColor: color ?? undefined }}
        aria-hidden
      />
    </div>
  );
}

export function MessageEdge({
  message,
  sequenceId,
  renderMessageClass,
  renderMeta,
  color,
  actorIndexMap,
  actorCount,
  messageY,
}: {
  message: SequenceMessage;
  sequenceId: string;
  renderMessageClass?: (
    messageClass: string,
    message: SequenceMessage,
  ) => ReactNode;
  renderMeta?: (
    meta: Record<string, string | number>,
    message: SequenceMessage,
  ) => ReactNode;
  color?: string;
  actorIndexMap: Record<string, number>;
  actorCount: number;
  messageY: number;
}) {
  const { controller } = useSequenceContext();
  const { highlight, styles } = controller.state;
  const fromIdx = actorIndexMap[message.from] ?? 0;
  const toIdx = actorIndexMap[message.to] ?? fromIdx;
  const colWidth = 100 / Math.max(actorCount, 1);
  const left = Math.min(fromIdx, toIdx) * colWidth + colWidth * 0.5;
  const width = Math.max(Math.abs(toIdx - fromIdx) * colWidth, colWidth * 0.2);
  const leftToRight = toIdx >= fromIdx;
  const styleMessageClass = message.messageClass
    ? styles.messageClasses[message.messageClass] ?? styles.messageClasses[message.originId ?? ""]
    : undefined;
  const messageStyle =
    styles.messages[message.id] ??
    (message.originId ? styles.messages[message.originId] : undefined);
  const active =
    highlight.messages.has(message.id) ||
    (message.originId && highlight.messages.has(message.originId)) ||
    (message.messageClass && highlight.messageClasses.has(message.messageClass)) ||
    (message.originId && highlight.messageClasses.has(message.originId)) ||
    highlight.actors.has(message.from) ||
    highlight.actors.has(message.to) ||
    highlight.sequences.has(sequenceId);

  const lineColor = color ?? "hsl(215 16% 47%)";
  const startDot = (
    <div
      className="h-[7px] w-[7px] rounded-full"
      style={{ backgroundColor: lineColor }}
      aria-hidden
    />
  );
  const endArrow = (
    <div
      className={cn(
        "h-0 w-0 border-y-[6px] border-y-transparent",
        leftToRight ? "border-l-[9px]" : "border-r-[9px] rotate-180",
      )}
      style={{
        borderLeftColor: leftToRight ? lineColor : undefined,
        borderRightColor: !leftToRight ? lineColor : undefined,
      }}
      aria-hidden
    />
  );

  return (
    <div
      className={cn(
        "absolute z-10 px-1 pointer-events-none",
        message.className,
        messageStyle,
        styleMessageClass,
      )}
      style={{ left: `${left}%`, width: `${width}%`, top: messageY }}
      data-message-id={message.id}
      data-active={active}
    >
      <div className="relative">
        <div
          className="absolute left-1/2 top-[-22px] -translate-x-1/2 pointer-events-auto"
          style={{ color: lineColor }}
        >
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold bg-white/90 shadow-sm",
              active && "ring-1 ring-primary/50 ring-offset-1",
            )}
          >
            <span>{message.label}</span>
            <ArrowRight className={cn("h-3 w-3", !leftToRight && "rotate-180")} />
            <span className="text-muted-foreground">
              {message.kind ?? "sync"}
            </span>
            {message.messageClass &&
              (renderMessageClass ? (
                renderMessageClass(message.messageClass, message)
              ) : (
                <Badge variant="outline">{message.messageClass}</Badge>
              ))}
          </div>
        </div>
        <div
          className="flex items-center"
          style={{ opacity: active ? 0.9 : 0.45 }}
        >
          {leftToRight ? (
            <>
              {startDot}
              <div
                className="mx-1 h-[2px] flex-1"
                style={{ backgroundColor: lineColor }}
              />
              {endArrow}
            </>
          ) : (
            <>
              {endArrow}
              <div
                className="mx-1 h-[2px] flex-1"
                style={{ backgroundColor: lineColor }}
              />
              {startDot}
            </>
          )}
        </div>
      </div>
      {message.meta && renderMeta && (
        <div className="mt-2">{renderMeta(message.meta, message)}</div>
      )}
    </div>
  );
}
