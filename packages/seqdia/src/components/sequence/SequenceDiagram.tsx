"use client";

import { useMemo, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { SequenceProvider, useSequenceContext } from "./SequenceProvider";
import type {
  SequenceController,
} from "../../hooks/useSequenceController";
import {
  useSequenceInteractions,
  type SequenceActorInteractions,
  type SequenceInteractionOptions,
  type SequenceInteractions,
  type SequenceMessageInteractions,
} from "../../hooks/useSequenceInteractions";
import {
  useSequenceLayout,
  type ResolvedMessage,
} from "../../hooks/useSequenceLayout";
import {
  type SequenceDiagramModel,
  type SequenceMessage,
} from "../../lib/sequence/types";
import { COLUMN_WIDTH } from "../../lib/constants";
import { cn, softColor } from "../../lib/utils";
import type { SequenceLayout, VisibleActor } from "../../lib/sequence/layout";

export type ActorStyle = {
  labelClassName?: string;
  regionClassName?: string;
  railClassName?: string;
  color?: string;
  backgroundColor?: string;
  railVariant?: "solid" | "dashed";
};

export type MessageStyle = {
  strokeColor?: string;
  labelClassName?: string;
};

export type ActorRenderProps = {
  actor: VisibleActor;
  highlighted: boolean;
  selected: boolean;
  label: React.ReactNode;
  style?: ActorStyle;
  buttonProps: SequenceActorInteractions<HTMLButtonElement>["props"];
  toggleExpand: () => void;
  controller: SequenceController;
};

export type MessageRenderProps = {
  resolved: ResolvedMessage;
  highlighted: boolean;
  selected: boolean;
  label: React.ReactNode;
  style?: MessageStyle;
  messageProps: SequenceMessageInteractions<HTMLDivElement>["props"];
};

export type SequenceSurfaceRenderContext = {
  layout: SequenceLayout;
  resolvedMessages: ResolvedMessage[];
  activeActors: Set<string>;
  gridTemplate: string;
  minWidth: number;
  viewWidth: number;
  header: React.ReactNode;
  canvas: React.ReactNode;
  interactions: SequenceInteractions;
};

export type SequenceSurfaceProps = {
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  canvasClassName?: string;
  renderActorLabel?: (actor: VisibleActor) => React.ReactNode;
  renderMessageLabel?: (message: SequenceMessage) => React.ReactNode;
  renderActor?: (props: ActorRenderProps) => React.ReactNode;
  renderMessage?: (props: MessageRenderProps) => React.ReactNode;
  renderRegionsLayer?: (props: RegionsProps) => React.ReactNode;
  renderRailsLayer?: (props: RailsProps) => React.ReactNode;
  renderMessagesLayer?: (props: MessagesProps) => React.ReactNode;
  onActorClick?: (actorId: string) => void;
  onMessageClick?: (messageId: string) => void;
  onSelectionChange?: SequenceInteractionOptions["onSelectionChange"];
  onHighlightChange?: SequenceInteractionOptions["onHighlightChange"];
  getActorStyle?: (actor: VisibleActor) => ActorStyle;
  getMessageStyle?: (message: SequenceMessage) => MessageStyle;
  interactionOptions?: Omit<
    SequenceInteractionOptions,
    | "onActorClick"
    | "onMessageClick"
    | "onSelectionChange"
    | "onHighlightChange"
  >;
  children?: (context: SequenceSurfaceRenderContext) => React.ReactNode;
};

export type SequenceSurfaceRootProps = {
  minWidth: number;
  className?: string;
  children: React.ReactNode;
};

export function SequenceSurfaceRoot({
  minWidth,
  className,
  children,
}: SequenceSurfaceRootProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div style={{ width: "100%", overflowX: "auto", display: "flex", justifyContent: "center" }}>
        <div style={{ minWidth, width: minWidth }}>{children}</div>
      </div>
    </div>
  );
}

export type SequenceCanvasSectionProps = {
  layout: SequenceLayout;
  minWidth: number;
  className?: string;
  children: React.ReactNode;
};

export function SequenceCanvasSection({
  layout,
  minWidth,
  className,
  children,
}: SequenceCanvasSectionProps) {
  const viewWidth = layout.leafCount * COLUMN_WIDTH;
  const height = layout.messageAreaHeight;
  return (
    <div
      className={cn("relative", className)}
      style={{ minWidth, height }}
    >
      <div style={{ position: "absolute", inset: 0, width: viewWidth }}>
        {children}
      </div>
    </div>
  );
}

export type SequenceDiagramProps = SequenceSurfaceProps & {
  model: SequenceDiagramModel;
  controller?: SequenceController;
};

/**
 * Default composition of the header, rails, regions, and messages.
 * Consumers can import and compose the layers or pass render props to override pieces.
 */
export function SequenceDiagram({
  model,
  controller,
  ...rest
}: SequenceDiagramProps) {
  return (
    <SequenceProvider model={model} controller={controller}>
      <SequenceSurface {...rest} />
    </SequenceProvider>
  );
}

export function SequenceSurface({
  className,
  renderActorLabel,
  renderMessageLabel,
  renderActor,
  renderMessage,
  onActorClick,
  onMessageClick,
  onSelectionChange,
  onHighlightChange,
  getActorStyle,
  getMessageStyle,
  interactionOptions,
  children,
  headerClassName,
  canvasClassName,
  contentClassName,
  renderRegionsLayer,
  renderRailsLayer,
  renderMessagesLayer,
}: SequenceSurfaceProps) {
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
  const viewWidth = layout.leafCount * COLUMN_WIDTH;

  const interactions = useSequenceInteractions({
    ...interactionOptions,
    onActorClick,
    onMessageClick,
    onSelectionChange,
    onHighlightChange,
  });

  const header = (
    <HeaderGrid
      layout={{ ...layout, gridTemplate }}
      renderActorLabel={renderActorLabel}
      renderActor={renderActor}
      getActorStyle={getActorStyle}
      interactions={interactions}
      className={headerClassName ?? "grid gap-2 border-b border-border/80 bg-white py-3"}
    />
  );

  const canvas = (
    <DiagramCanvas
      layout={layout}
      minWidth={minWidth}
      renderMessageLabel={renderMessageLabel}
      renderMessage={renderMessage}
      resolvedMessages={resolvedMessages}
      activeActors={activeActors}
      getActorStyle={getActorStyle}
      getMessageStyle={getMessageStyle}
      interactions={interactions}
      className={canvasClassName ?? "relative bg-white"}
      renderRegionsLayer={renderRegionsLayer}
      renderRailsLayer={renderRailsLayer}
      renderMessagesLayer={renderMessagesLayer}
    />
  );

  const surfaceContext: SequenceSurfaceRenderContext = {
    layout,
    resolvedMessages,
    activeActors,
    gridTemplate,
    minWidth,
    viewWidth,
    header,
    canvas,
    interactions,
  };

  return (
    <SequenceSurfaceRoot
      minWidth={minWidth}
      className={cn("overflow-hidden", className)}
    >
      <div className={contentClassName}>
        {children ? (
          children(surfaceContext)
        ) : (
          <>
            {header}
            {canvas}
          </>
        )}
      </div>
    </SequenceSurfaceRoot>
  );
}

export type HeaderGridProps = {
  layout: SequenceLayout & { gridTemplate: string };
  renderActorLabel?: (actor: VisibleActor) => React.ReactNode;
  renderActor?: (props: ActorRenderProps) => React.ReactNode;
  getActorStyle?: SequenceSurfaceProps["getActorStyle"];
  interactions: SequenceInteractions;
  className?: string;
};

export function HeaderGrid({
  layout,
  renderActorLabel,
  renderActor,
  getActorStyle,
  interactions,
  className,
}: HeaderGridProps) {
  const { controller } = useSequenceContext();

  return (
    <div
      className={cn("grid gap-2 border-b border-border/80 bg-white py-3", className)}
      style={{
        gridTemplateColumns: layout.gridTemplate,
        gridAutoRows: `${layout.headerRowHeight}px`,
      }}
    >
      {layout.headerRows.flatMap((row, depth) =>
        row.map((actor) => {
          const style = getActorStyle?.(actor);
          const button = interactions.getActorInteractions<HTMLButtonElement>(
            actor.actorId,
          );
          const labelNode = renderActorLabel ? (
            renderActorLabel(actor)
          ) : (
            <span className={cn("truncate", style?.labelClassName)}>
              {actor.label}
            </span>
          );

          const justify =
            actor.alignment === "left"
              ? "justify-start"
              : actor.alignment === "right"
                ? "justify-end"
                : "justify-center";

          const node = renderActor ? (
            renderActor({
              actor,
              highlighted: button.highlighted,
              selected: button.selected,
              label: labelNode,
              style,
              buttonProps: {
                ...button.props,
                onClick: (event) => {
                  if (actor.hasChildren) {
                    controller.toggleActorExpansion(actor.actorId);
                  }
                  button.props.onClick?.(event);
                },
              },
              toggleExpand: () => controller.toggleActorExpansion(actor.actorId),
              controller,
            })
          ) : (
            <DefaultActorButton
              actor={actor}
              buttonProps={button.props}
              highlighted={button.highlighted}
              selected={button.selected}
              label={labelNode}
              style={style}
              controller={controller}
            />
          );

          return (
            <div
              key={`${actor.actorId}-${depth}`}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gridColumn: `${actor.leafStart + 1} / span ${actor.leafSpan}`,
                gridRow: depth + 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: justify,
                }}
              >
                {node}
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
}

type DefaultActorButtonProps = {
  actor: VisibleActor;
  highlighted: boolean;
  selected: boolean;
  label: ReactNode;
  style?: ActorStyle;
  buttonProps: SequenceActorInteractions<HTMLButtonElement>["props"];
  controller: SequenceController;
};

function DefaultActorButton({
  actor,
  highlighted,
  selected,
  label,
  style,
  buttonProps,
  controller,
}: DefaultActorButtonProps) {
  const color = style?.color;
  const background = style?.backgroundColor;

  const { onClick, className, style: inlineStyle, ...rest } = buttonProps;

  return (
    <button
      type="button"
      {...rest}
      onClick={(event) => {
        if (actor.hasChildren) {
          controller.toggleActorExpansion(actor.actorId);
        }
        onClick?.(event);
      }}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition",
        actor.className,
        className,
        highlighted && "ring-1 ring-primary/60 text-primary",
        selected && "ring-2 ring-primary/70 ring-offset-1",
      )}
      style={{
        ...inlineStyle,
        borderColor: color ?? inlineStyle?.borderColor,
        backgroundColor: background ?? inlineStyle?.backgroundColor,
      }}
    >
      {actor.hasChildren && (
        actor.expanded ? (
          <ChevronDown style={{ width: 16, height: 16, color: "#6b7280" }} />
        ) : (
          <ChevronRight style={{ width: 16, height: 16, color: "#6b7280" }} />
        )
      )}
      {label}
    </button>
  );
}

export type RegionsProps = {
  layout: SequenceLayout;
  getActorStyle?: SequenceSurfaceProps["getActorStyle"];
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
              className={actor.regionClassName}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
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
  getActorStyle?: SequenceSurfaceProps["getActorStyle"];
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
            className={style?.railClassName}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 2,
              left: x,
              backgroundColor: stroke,
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
  renderMessage?: (props: MessageRenderProps) => React.ReactNode;
  getMessageStyle?: SequenceSurfaceProps["getMessageStyle"];
  interactions: SequenceInteractions;
};

export function MessagesLayer({
  resolvedMessages,
  renderMessageLabel,
  renderMessage,
  getMessageStyle,
  interactions,
}: MessagesProps) {
  const { controller } = useSequenceContext();
  const { highlight } = controller.state;

  return (
    <>
      {resolvedMessages.map((resolved) => {
        const { message, y, fromResolved, toResolved, fromX, toX, direction } =
          resolved;
        const left = Math.min(fromX, toX);
        const width = Math.max(Math.abs(toX - fromX), COLUMN_WIDTH * 0.35);
        const style = getMessageStyle?.(message);
        const stroke = style?.strokeColor ?? "#111827";
        const messageState = interactions.getMessageInteractions<HTMLDivElement>(
          message.messageId,
        );
        const strokeHighlighted =
          messageState.highlighted ||
          highlight.actors.has(fromResolved.actorId) ||
          highlight.actors.has(toResolved.actorId);
        const selected = messageState.selected;
        const messageProps = {
          ...messageState.props,
          "data-highlighted": strokeHighlighted ? "true" : undefined,
          "data-selected": selected ? "true" : undefined,
          className: messageState.props.className,
          style: {
            ...(messageState.props.style ?? {}),
            position: "absolute" as const,
            top: y - 2,
            left,
            width,
          },
        };
        const labelNode = renderMessageLabel ? (
          renderMessageLabel(message)
        ) : (
          <span>{message.label}</span>
        );

        if (renderMessage) {
          const rendered = renderMessage({
            resolved,
            highlighted: strokeHighlighted,
            selected,
            label: labelNode,
            style,
            messageProps,
          });
          // Clone with key for array rendering since renderMessage returns a node without key
          return (
            <div key={message.messageId} style={{ display: "contents" }}>
              {rendered}
            </div>
          );
        }

        return (
          <div
            key={message.messageId}
            {...messageProps}
            style={{ cursor: "pointer", ...(messageProps.style ?? {}) }}
          >
            <MessageArrow direction={direction} stroke={stroke} />
            <div
              style={{
                pointerEvents: "none",
                marginTop: 4,
                display: "flex",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <MessageLabel
                highlighted={strokeHighlighted}
                selected={selected}
                className={cn(message.className, style?.labelClassName)}
              >
                {labelNode}
              </MessageLabel>
            </div>
          </div>
        );
      })}
    </>
  );
}

export type MessageArrowProps = {
  direction: 1 | -1;
  stroke: string;
  className?: string;
};

export function MessageArrow({ direction, stroke, className }: MessageArrowProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {direction > 0 ? (
        <>
          <span
            style={{
              display: "inline-block",
              height: 7,
              width: 7,
              borderRadius: 9999,
              backgroundColor: stroke,
            }}
          />
          <div
            style={{
              flex: 1,
              height: 2,
              backgroundColor: stroke,
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderLeft: `10px solid ${stroke}`,
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderRight: `10px solid ${stroke}`,
            }}
          />
          <div
            style={{
              flex: 1,
              height: 2,
              backgroundColor: stroke,
            }}
          />
          <span
            style={{
              display: "inline-block",
              height: 7,
              width: 7,
              borderRadius: 9999,
              backgroundColor: stroke,
            }}
          />
        </>
      )}
    </div>
  );
}

export type MessageLabelProps = {
  highlighted: boolean;
  selected: boolean;
  className?: string;
  children: React.ReactNode;
};

export function MessageLabel({
  highlighted,
  selected,
  className,
  children,
}: MessageLabelProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-slate-200",
        className,
        highlighted && "ring-primary/60 text-primary",
        selected && "ring-2 ring-primary/70",
      )}
      data-highlighted={highlighted ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
    >
      {children}
    </div>
  );
}

type DiagramCanvasProps = {
  layout: SequenceLayout;
  minWidth: number;
  renderMessageLabel?: (message: SequenceMessage) => React.ReactNode;
  renderMessage?: (props: MessageRenderProps) => React.ReactNode;
  resolvedMessages: ResolvedMessage[];
  activeActors: Set<string>;
  getActorStyle?: SequenceSurfaceProps["getActorStyle"];
  getMessageStyle?: SequenceSurfaceProps["getMessageStyle"];
  interactions: SequenceInteractions;
  className?: string;
  renderRegionsLayer?: (props: RegionsProps) => React.ReactNode;
  renderRailsLayer?: (props: RailsProps) => React.ReactNode;
  renderMessagesLayer?: (props: MessagesProps) => React.ReactNode;
};

function DiagramCanvas({
  layout,
  minWidth,
  renderMessageLabel,
  renderMessage,
  resolvedMessages,
  activeActors,
  getActorStyle,
  getMessageStyle,
  interactions,
  className,
  renderRegionsLayer,
  renderRailsLayer,
  renderMessagesLayer,
}: DiagramCanvasProps) {
  const regions = renderRegionsLayer ? (
    renderRegionsLayer({ layout, getActorStyle })
  ) : (
    <RegionsLayer layout={layout} getActorStyle={getActorStyle} />
  );

  const rails = renderRailsLayer ? (
    renderRailsLayer({ layout, activeActors, getActorStyle })
  ) : (
    <RailsLayer
      layout={layout}
      activeActors={activeActors}
      getActorStyle={getActorStyle}
    />
  );

  const messages = renderMessagesLayer ? (
    renderMessagesLayer({
      resolvedMessages,
      renderMessageLabel,
      renderMessage,
      getMessageStyle,
      interactions,
    })
  ) : (
    <MessagesLayer
      resolvedMessages={resolvedMessages}
      renderMessageLabel={renderMessageLabel}
      renderMessage={renderMessage}
      getMessageStyle={getMessageStyle}
      interactions={interactions}
    />
  );

  return (
    <SequenceCanvasSection layout={layout} minWidth={minWidth} className={className}>
      {regions}
      {rails}
      {messages}
    </SequenceCanvasSection>
  );
}
