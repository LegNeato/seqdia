"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  SequenceProvider,
  useSequenceContext,
} from "./SequenceProvider";
import type { SequenceController } from "../../hooks/useSequenceController";
import { useSequenceLayout, type ResolvedMessage } from "../../hooks/useSequenceLayout";
import { type SequenceDiagramModel, type SequenceMessage } from "../../lib/sequence/types";
import { COLUMN_WIDTH } from "../../lib/constants";
import { cn, softColor } from "../../lib/utils";
import type { SequenceLayout, VisibleActor } from "../../lib/sequence/layout";

type SequenceDiagramProps = {
  model: SequenceDiagramModel;
  controller?: SequenceController;
  className?: string;
  renderActorLabel?: (actor: VisibleActor) => React.ReactNode;
  renderMessageLabel?: (message: SequenceMessage) => React.ReactNode;
  onActorClick?: (actorId: string) => void;
  onMessageClick?: (messageId: string) => void;
  getActorStyle?: (actor: VisibleActor) => {
    labelClassName?: string;
    regionClassName?: string;
    railClassName?: string;
    color?: string;
    backgroundColor?: string;
    railVariant?: "solid" | "dashed";
  };
  getMessageStyle?: (message: SequenceMessage) => {
    strokeColor?: string;
    bubbleClassName?: string;
  };
};

/**
 * Default composition of the header, rails, regions, and messages.
 * Consumers can import and compose the layers directly.
 */
export function SequenceDiagram(props: SequenceDiagramProps) {
  return (
    <SequenceProvider model={props.model} controller={props.controller}>
      <SequenceSurface {...props} />
    </SequenceProvider>
  );
}

type SurfaceProps = SequenceDiagramProps & {
  controller?: SequenceController;
};

function SequenceSurface({
  className,
  renderActorLabel,
  renderMessageLabel,
  onActorClick,
  onMessageClick,
  getActorStyle,
  getMessageStyle,
}: SurfaceProps) {
  const { model, controller } = useSequenceContext();
  const { layout, resolvedMessages, activeActors } = useSequenceLayout(
    model,
    controller,
  );

  const gridTemplate = useMemo(
    () => `repeat(${layout.leafCount}, ${COLUMN_WIDTH}px)`,
    [layout.leafCount],
  );
  const minWidth = layout.leafCount * COLUMN_WIDTH;

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth }}>
            <HeaderGrid
              layout={{ ...layout, gridTemplate }}
              onActorClick={onActorClick}
              renderActorLabel={renderActorLabel}
              getActorStyle={getActorStyle}
            />
            <DiagramCanvas
              layout={layout}
              minWidth={minWidth}
              renderMessageLabel={renderMessageLabel}
              onMessageClick={onMessageClick}
              resolvedMessages={resolvedMessages}
              activeActors={activeActors}
              getActorStyle={getActorStyle}
              getMessageStyle={getMessageStyle}
            />
        </div>
      </div>
    </div>
  );
}

export type HeaderGridProps = {
  layout: SequenceLayout & { gridTemplate: string };
  renderActorLabel?: (actor: VisibleActor) => React.ReactNode;
  onActorClick?: (actorId: string) => void;
  getActorStyle?: SequenceDiagramProps["getActorStyle"];
};

export function HeaderGrid({
  layout,
  renderActorLabel,
  onActorClick,
  getActorStyle,
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
          const style = getActorStyle?.(actor);
          const color = style?.color;
          const background = style?.backgroundColor;
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
                      controller.toggleActorExpansion(actor.actorId);
                    }
                    controller.toggleActorSelection(actor.actorId);
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

export type RegionsProps = {
  layout: SequenceLayout;
  getActorStyle?: SequenceDiagramProps["getActorStyle"];
};

export function RegionsLayer({
  layout,
  getActorStyle,
}: RegionsProps) {
  const regionNodes = [...layout.visibleActors]
    .filter((actor) => actor.hasChildren && actor.expanded)
    .sort((a, b) => a.depth - b.depth);

  return (
    <>
      {regionNodes.map((actor) => {
        const span = layout.spans[actor.actorId];
        const xStart = span.start * COLUMN_WIDTH;
        const xEnd = span.end * COLUMN_WIDTH;
        const style = getActorStyle?.(actor);
        const color = style?.color ?? "hsl(215 16% 70%)";
        const baseFill = style?.backgroundColor ?? softColor(color, 99.4);
        const fill =
          actor.hasChildren && actor.expanded ? softColor(color, 97.5) : baseFill;

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
          </div>
        );
      })}
    </>
  );
}

export type RailsProps = {
  layout: SequenceLayout;
  activeActors: Set<string>;
  getActorStyle?: SequenceDiagramProps["getActorStyle"];
};

export function RailsLayer({ layout, activeActors, getActorStyle }: RailsProps) {
  const { controller } = useSequenceContext();
  const { highlight, selection } = controller.state;
  const leafNodes = layout.visibleActors.filter((actor) => actor.isLeaf);

  return (
    <>
      {leafNodes.map((actor) => {
        const x = layout.anchors[actor.actorId] * COLUMN_WIDTH;
        const highlighted = highlight.actors.has(actor.actorId);
        const selected = selection.actors.has(actor.actorId);
        const style = getActorStyle?.(actor);
        const base = style?.color ?? "hsl(215 16% 70%)";
        const active =
          selected || highlighted || activeActors.has(actor.actorId);
        const stroke = active ? base : softColor(base, 70);

        return (
          <div
            key={`line-${actor.actorId}`}
            className={cn("absolute inset-y-0 w-[2px]", style?.railClassName)}
            style={{
              left: x,
              backgroundColor: active ? stroke : undefined,
              borderColor: undefined,
            }}
          />
        );
      })}
    </>
  );
}

export type MessagesProps = {
  resolvedMessages: ResolvedMessage[];
  renderMessageLabel?: (message: SequenceMessage) => React.ReactNode;
  onMessageClick?: (messageId: string) => void;
  getMessageStyle?: SequenceDiagramProps["getMessageStyle"];
};

export function MessagesLayer({
  resolvedMessages,
  renderMessageLabel,
  onMessageClick,
  getMessageStyle,
}: MessagesProps) {
  const { controller } = useSequenceContext();
  const { highlight, selection } = controller.state;

  return (
    <>
      {resolvedMessages.map(
        ({ message, y, fromResolved, toResolved, fromX, toX, direction }) => {
          const left = Math.min(fromX, toX);
          const width = Math.max(Math.abs(toX - fromX), COLUMN_WIDTH * 0.35);
          const style = getMessageStyle?.(message);
          const stroke = style?.strokeColor ?? "#111827"; // neutral black/near-black for all messages
          const strokeHighlighted =
            highlight.messages.has(message.messageId) ||
            highlight.actors.has(fromResolved.actorId) ||
            highlight.actors.has(toResolved.actorId);
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
                controller.toggleMessageSelection(message.messageId);
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
        },
      )}
    </>
  );
}

function DiagramCanvas({
  layout,
  minWidth,
  renderMessageLabel,
  onMessageClick,
  resolvedMessages,
  activeActors,
  getActorStyle,
  getMessageStyle,
}: DiagramCanvasProps) {
  const viewWidth = layout.leafCount * COLUMN_WIDTH;
  const height = layout.messageAreaHeight;

  return (
    <div
      className="relative"
      style={{ minWidth, height }}
    >
      <div className="absolute inset-0" style={{ width: viewWidth }}>
        <RegionsLayer
          layout={layout}
          getActorStyle={getActorStyle}
        />

        <RailsLayer
          layout={layout}
          activeActors={activeActors}
          getActorStyle={getActorStyle}
        />

        <MessagesLayer
          resolvedMessages={resolvedMessages}
          renderMessageLabel={renderMessageLabel}
          onMessageClick={onMessageClick}
          getMessageStyle={getMessageStyle}
        />
      </div>
    </div>
  );
}

type DiagramCanvasProps = {
  layout: SequenceLayout;
  minWidth: number;
  renderMessageLabel?: (message: SequenceMessage) => React.ReactNode;
  onMessageClick?: (messageId: string) => void;
  resolvedMessages: ResolvedMessage[];
  activeActors: Set<string>;
  getActorStyle?: SequenceDiagramProps["getActorStyle"];
  getMessageStyle?: SequenceDiagramProps["getMessageStyle"];
};
