"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  SequenceProvider,
  useSequenceContext,
} from "@/components/sequence/SequenceProvider";
import type { SequenceController } from "@/hooks/useSequenceController";
import { computeLayout, type VisibleActor } from "@/lib/sequence/layout";
import type {
  SequenceDiagramModel,
  ActorNode,
  SequenceMessage,
} from "@/lib/sequence/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const COLUMN_WIDTH = 140;
function softColor(color: string, lightness: number) {
  const match = /hsl\(\s*([-\d.]+)\s+([-\d.]+)%\s+([-\d.]+)%/.exec(color);
  if (!match) return color;
  const [, h, s] = match;
  const safeLightness = Math.min(Math.max(lightness, 0), 100);
  const safeSat = Math.min(Math.max(parseFloat(s), 0), 100);
  return `hsl(${parseFloat(h)} ${safeSat}% ${safeLightness}%)`;
}

function collectActorIds(nodes: ActorNode[]): string[] {
  return nodes.flatMap((node) => [
    node.actorId,
    ...collectActorIds(node.children ?? []),
  ]);
}

function hueFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return (hash + 360) % 360;
}

type SequenceDiagramProps = {
  model: SequenceDiagramModel;
  controller?: SequenceController;
  className?: string;
  renderActorLabel?: (actor: VisibleActor) => React.ReactNode;
  renderMessageLabel?: (message: SequenceMessage) => React.ReactNode;
  onActorClick?: (actorId: string) => void;
  onMessageClick?: (messageId: string) => void;
};

export function SequenceDiagram({
  model,
  controller,
  className,
  renderActorLabel,
  renderMessageLabel,
  onActorClick,
  onMessageClick,
}: SequenceDiagramProps) {
  return (
    <SequenceProvider model={model} controller={controller}>
      <SequenceSurface
        className={className}
        renderActorLabel={renderActorLabel}
        renderMessageLabel={renderMessageLabel}
        onActorClick={onActorClick}
        onMessageClick={onMessageClick}
      />
    </SequenceProvider>
  );
}

type SurfaceProps = {
  className?: string;
  renderActorLabel?: (actor: VisibleActor) => React.ReactNode;
  renderMessageLabel?: (message: SequenceMessage) => React.ReactNode;
  onActorClick?: (actorId: string) => void;
  onMessageClick?: (messageId: string) => void;
};

function SequenceSurface({
  className,
  renderActorLabel,
  renderMessageLabel,
  onActorClick,
  onMessageClick,
}: SurfaceProps) {
  const { model, controller } = useSequenceContext();

  const layout = useMemo(
    () =>
      computeLayout(model, {
        expandedActorIds: controller.state.expandedActors,
      }),
    [controller.state.expandedActors, model],
  );

  const gridTemplate = useMemo(
    () => `repeat(${layout.leafCount}, ${COLUMN_WIDTH}px)`,
    [layout.leafCount],
  );
  const minWidth = layout.leafCount * COLUMN_WIDTH;
  const actorColors = useMemo(() => {
    const map: Record<string, string> = {};
    const ids = Array.from(new Set(collectActorIds(model.actors)));
    ids.forEach((id, idx) => {
      const hue = (hueFromId(id) + idx * 5) % 360;
      map[id] = `hsl(${hue.toFixed(1)} 72% 52%)`;
    });
    return map;
  }, [model.actors]);
  const actorBackgrounds = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(actorColors).forEach(([id, color]) => {
      map[id] = softColor(color, 94);
    });
    return map;
  }, [actorColors]);

  return (
    <Card className={cn("overflow-hidden border-border/80", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {model.title ?? "Sequence diagram"}
        </CardTitle>
        {model.description && (
          <CardDescription>{model.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <div style={{ minWidth }}>
            <HeaderGrid
              layout={{ ...layout, gridTemplate }}
              onActorClick={onActorClick}
              renderActorLabel={renderActorLabel}
              actorColors={actorColors}
              actorBackgrounds={actorBackgrounds}
            />
            <DiagramCanvas
              layout={layout}
              minWidth={minWidth}
              renderMessageLabel={renderMessageLabel}
              onMessageClick={onMessageClick}
              actorColors={actorColors}
              actorBackgrounds={actorBackgrounds}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type HeaderGridProps = {
  layout: ReturnType<typeof computeLayout> & { gridTemplate: string };
  renderActorLabel?: (actor: VisibleActor) => React.ReactNode;
  onActorClick?: (actorId: string) => void;
  actorColors: Record<string, string>;
  actorBackgrounds: Record<string, string>;
};

function HeaderGrid({
  layout,
  renderActorLabel,
  onActorClick,
  actorColors,
  actorBackgrounds,
}: HeaderGridProps) {
  const { controller } = useSequenceContext();
  const { highlight, selection } = controller.state;

  return (
    <div
      className="grid gap-2 border-b border-border/80 bg-white py-3"
      style={{
        gridTemplateColumns: layout.gridTemplate,
        gridAutoRows: `${layout.headerRowHeight}px`,
      }}
    >
      {layout.headerRows.flatMap((row, depth) =>
        row.map((actor) => {
          const highlighted = highlight.actors.has(actor.actorId);
          const selected = selection.actors.has(actor.actorId);
          const color = actorColors[actor.actorId];
          const background = actorBackgrounds[actor.actorId];
          const justify =
            actor.alignment === "left"
              ? "justify-start"
              : actor.alignment === "right"
                ? "justify-end"
                : "justify-center";

          return (
            <div
              key={`${actor.actorId}-${depth}`}
              style={{
                gridColumn: `${actor.leafStart + 1} / span ${actor.leafSpan}`,
                gridRow: depth + 1,
              }}
              className="flex flex-col justify-center"
            >
              <div className={cn("flex items-center gap-2", justify)}>
                <button
                  type="button"
                  onClick={() => {
                    if (actor.hasChildren) {
                      controller.api.toggleActorExpansion(actor.actorId);
                    }
                    controller.api.toggleActorSelection(actor.actorId);
                    onActorClick?.(actor.actorId);
                  }}
                  data-actor-id={actor.actorId}
                  data-highlighted={highlighted ? "true" : undefined}
                  data-selected={selected ? "true" : undefined}
                  className={cn(
                    "flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition border",
                    actor.className,
                    highlighted && "ring-1 ring-primary/60 text-primary",
                    selected && "ring-2 ring-primary/70 ring-offset-1",
                  )}
                  style={{
                    borderColor: color ?? undefined,
                    backgroundColor: background,
                  }}
                >
                  {actor.hasChildren && (
                    actor.expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )
                  )}
                  {renderActorLabel ? (
                    renderActorLabel(actor)
                  ) : (
                    <span className="truncate">{actor.label}</span>
                  )}
                </button>
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
}

type DiagramCanvasProps = {
  layout: ReturnType<typeof computeLayout>;
  minWidth: number;
  renderMessageLabel?: (message: SequenceMessage) => React.ReactNode;
  onMessageClick?: (messageId: string) => void;
  actorColors: Record<string, string>;
  actorBackgrounds: Record<string, string>;
};

function DiagramCanvas({
  layout,
  minWidth,
  renderMessageLabel,
  onMessageClick,
  actorColors,
  actorBackgrounds,
}: DiagramCanvasProps) {
  const { controller } = useSequenceContext();
  const { highlight, selection } = controller.state;

  const viewWidth = layout.leafCount * COLUMN_WIDTH;
  const height = layout.messageAreaHeight;
  const actorMap = layout.visibleActorMap;
  const activeActors = useMemo(() => {
    const set = new Set<string>();
    layout.messages.forEach(({ message }) => {
      set.add(message.fromActorId);
      set.add(message.toActorId);
    });
    return set;
  }, [layout.messages]);

  const regionNodes = [...layout.visibleActors]
    .filter((actor) => actor.hasChildren && actor.expanded)
    .sort((a, b) => a.depth - b.depth);
  const leafNodes = layout.visibleActors.filter((actor) => actor.isLeaf);
  const lastEndpoint = useMemo(() => new Map<string, number>(), []);

  return (
    <div
      className="relative"
      style={{ minWidth, height }}
    >
      <div className="absolute inset-0" style={{ width: viewWidth }}>
        {regionNodes.map((actor) => {
          const span = layout.spans[actor.actorId];
          const xStart = span.start * COLUMN_WIDTH;
          const xEnd = span.end * COLUMN_WIDTH;
          const highlighted = highlight.actors.has(actor.actorId);
          const selected = selection.actors.has(actor.actorId);
          const color = actorColors[actor.actorId] ?? "hsl(215 16% 70%)";
          const baseFill = actorBackgrounds[actor.actorId] ?? softColor(color, 99.3);
          const fill = baseFill;
          const toAnchor = layout.anchors[actor.actorId] * COLUMN_WIDTH;
          const leftAnchor = span.start * COLUMN_WIDTH;
          const rightAnchor = span.end * COLUMN_WIDTH;

          return (
            <div key={`region-${actor.actorId}`}>
              <div
                className={cn("absolute inset-y-0", actor.regionClassName)}
                style={{
                  left: xStart,
                  width: xEnd - xStart,
                  background: fill,
                }}
              />
              <div
                className="absolute inset-y-0 w-[2px]"
                style={{
                  left: xStart,
                  backgroundColor: color,
                  borderColor: color,
                  borderLeftStyle: toAnchor <= leftAnchor ? "dashed" : "solid",
                }}
              />
              <div
                className="absolute inset-y-0 w-[2px]"
                style={{
                  left: xEnd,
                  backgroundColor: color,
                  borderColor: color,
                  borderRightStyle: toAnchor >= rightAnchor ? "dashed" : "solid",
                }}
              />
            </div>
          );
        })}

        {leafNodes.map((actor) => {
          const x = layout.anchors[actor.actorId] * COLUMN_WIDTH;
          const highlighted = highlight.actors.has(actor.actorId);
          const selected = selection.actors.has(actor.actorId);
          const base = actorColors[actor.actorId] ?? "hsl(215 16% 70%)";
          const active =
            selected || highlighted || activeActors.has(actor.actorId);
          const stroke = active ? base : softColor(base, 70);

          return (
            <div
              key={`line-${actor.actorId}`}
              className={cn(
                "absolute inset-y-0 w-[2px]",
                !active && "border-l border-dashed",
              )}
              style={{
                left: x,
                backgroundColor: active ? stroke : undefined,
                borderColor: active ? undefined : stroke,
              }}
            />
          );
        })}

        {layout.messages.map(({ message, y }) => {
          const resolveEndpoint = (
            actorId: string,
            toward: "left" | "right",
          ) => {
            const actor = actorMap[actorId];
            if (actor && actor.hasChildren && actor.expanded) {
              const span = layout.spans[actorId];
              return (toward === "right" ? span.end : span.start) * COLUMN_WIDTH;
            }
            const span = layout.spans[actorId];
            const width = span.end - span.start;
            if (width > 1) {
              return toward === "right"
                ? span.end * COLUMN_WIDTH
                : span.start * COLUMN_WIDTH;
            }
            return layout.anchors[actorId] * COLUMN_WIDTH;
          };

          const toAnchor =
            layout.anchors[message.toActorId] * COLUMN_WIDTH;
          const directionHint =
            toAnchor >= (layout.anchors[message.fromActorId] ?? 0) ? 1 : -1;
          const previousFrom = lastEndpoint.get(message.fromActorId);
          const fromX =
            previousFrom ??
            resolveEndpoint(
              message.fromActorId,
              directionHint > 0 ? "right" : "left",
            );
          const toX = resolveEndpoint(
            message.toActorId,
            directionHint > 0 ? "left" : "right",
          );
          const direction = toX >= fromX ? 1 : -1;
          lastEndpoint.set(message.toActorId, toX);
          const left = Math.min(fromX, toX);
          const width = Math.max(Math.abs(toX - fromX), COLUMN_WIDTH * 0.35);
          const stroke = "#111827"; // neutral black/near-black for all messages
          const strokeHighlighted =
            highlight.messages.has(message.messageId) ||
            highlight.actors.has(message.fromActorId) ||
            highlight.actors.has(message.toActorId);
          const selected = selection.messages.has(message.messageId);

          return (
            <div
              key={message.messageId}
              className="absolute z-10 cursor-pointer"
              data-message-id={message.messageId}
              data-highlighted={
                strokeHighlighted ? "true" : undefined
              }
              data-selected={
                selected ? "true" : undefined
              }
              style={{ top: y - 2, left, width }}
              onClick={() => {
                controller.api.toggleMessageSelection(message.messageId);
                onMessageClick?.(message.messageId);
              }}
            >
              <div className="flex items-center">
                {direction > 0 ? (
                  <>
                    <span
                      className="h-[7px] w-[7px] rounded-full"
                      style={{ backgroundColor: stroke }}
                    />
                    <div
                      className="mx-1 h-[2px] flex-1"
                      style={{ backgroundColor: stroke }}
                    />
                    <div
                      className="h-0 w-0 border-y-[6px] border-y-transparent"
                      style={{
                        borderLeft: `10px solid ${stroke}`,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div
                      className="h-0 w-0 border-y-[6px] border-y-transparent"
                      style={{
                        borderRight: `10px solid ${stroke}`,
                      }}
                    />
                    <div
                      className="mx-1 h-[2px] flex-1"
                      style={{ backgroundColor: stroke }}
                    />
                    <span
                      className="h-[7px] w-[7px] rounded-full"
                      style={{ backgroundColor: stroke }}
                    />
                  </>
                )}
              </div>
              <div className="pointer-events-none mt-1 flex w-full justify-center">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-slate-200",
                    strokeHighlighted && "ring-primary/60 text-primary",
                    selected && "ring-2 ring-primary/70",
                    message.className,
                  )}
                >
                  {renderMessageLabel ? (
                    renderMessageLabel(message)
                  ) : (
                    <span className="truncate">{message.label}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
