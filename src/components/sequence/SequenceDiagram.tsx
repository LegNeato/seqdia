"use client";

import { useMemo, type ReactNode } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  GitCompare,
  Sparkles,
} from "lucide-react";

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
import type { Sequence, SequenceActor, SequenceMessage } from "@/lib/sequence/types";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

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
  const layout = useMemo(
    () => computeLayout(sequence, { height }),
    [height, sequence],
  );

  const uniqueMessageClasses = useMemo(
    () =>
      Array.from(
        new Set(
          sequence.messages
            .map((message) => message.messageClass)
            .filter(Boolean) as string[],
        ),
      ),
    [sequence.messages],
  );

  const messageClassSamples = useMemo(() => {
    const map: Record<string, SequenceMessage | undefined> = {};
    sequence.messages.forEach((message) => {
      if (message.messageClass && !map[message.messageClass]) {
        map[message.messageClass] = message;
      }
    });
    return map;
  }, [sequence.messages]);

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
          renderActorLabel={renderActorLabel}
          renderMessageClass={renderMessageClass}
          renderMeta={renderMeta}
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
  renderActorLabel,
  renderMessageClass,
  renderMeta,
}: {
  layout: SequenceLayout;
  renderActorLabel?: (actor: SequenceActor) => ReactNode;
  renderMessageClass?: (
    messageClass: string,
    message: SequenceMessage,
  ) => ReactNode;
  renderMeta?: (
    meta: Record<string, string | number>,
    message: SequenceMessage,
  ) => ReactNode;
}) {
  const { sequence } = useSequenceContext();

  return (
    <div className="relative">
      <ActorHeader layout={layout} renderActorLabel={renderActorLabel} />
      <NestedSequences
        layout={layout}
        renderActorLabel={renderActorLabel}
        renderMessageClass={renderMessageClass}
        renderMeta={renderMeta}
      />
      <div className="relative mt-10">
        <div className="absolute inset-0">
          {sequence.actors.map((actor) => (
            <ActorLane key={actor.id} actor={actor} layout={layout} />
          ))}
        </div>
        <div className="relative" style={{ height: layout.height }}>
          {sequence.messages.map((message) => (
            <MessageEdge
              key={message.id}
              message={message}
              layout={layout}
              sequenceId={sequence.id}
              renderMessageClass={renderMessageClass}
              renderMeta={renderMeta}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActorHeader({
  layout,
  renderActorLabel,
}: {
  layout: SequenceLayout;
  renderActorLabel?: (actor: SequenceActor) => ReactNode;
}) {
  const { sequence } = useSequenceContext();

  return (
    <div className="relative h-16">
      {sequence.actors.map((actor) => (
        <ActorAnchor
          key={actor.id}
          actor={actor}
          x={layout.actorPositions[actor.id]}
          renderActorLabel={renderActorLabel}
        />
      ))}
    </div>
  );
}

export function ActorAnchor({
  actor,
  x,
  renderActorLabel,
}: {
  actor: SequenceActor;
  x: number;
  renderActorLabel?: (actor: SequenceActor) => ReactNode;
}) {
  const { controller } = useSequenceContext();
  const { highlight, styles, collapsedActors } = controller.state;
  const hasChild = Boolean(actor.embeddedSequence);
  const collapsed = collapsedActors.has(actor.id);
  const isHighlighted =
    highlight.actors.has(actor.id) ||
    (actor.embeddedSequence &&
      highlight.sequences.has(actor.embeddedSequence.id));

  return (
    <div
      className="absolute flex w-40 -translate-x-1/2 flex-col items-center gap-1"
      style={{ left: `${x}%` }}
    >
      <button
        className={cn(
          "flex min-h-10 w-full items-center justify-center gap-2 rounded-full border bg-background px-3 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-[1px] hover:shadow",
          styles.actors[actor.id],
          actor.className,
          isHighlighted && "ring-2 ring-primary/50 ring-offset-1",
        )}
        onClick={
          hasChild ? () => controller.api.toggleActor(actor.id) : undefined
        }
        aria-pressed={!collapsed}
        aria-label={`Actor ${actor.label}`}
        data-actor-id={actor.id}
      >
        {renderActorLabel ? (
          renderActorLabel(actor)
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{actor.label}</span>
          </>
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

export function NestedSequences({
  layout,
  renderActorLabel,
  renderMessageClass,
  renderMeta,
}: {
  layout: SequenceLayout;
  renderActorLabel?: (actor: SequenceActor) => ReactNode;
  renderMessageClass?: (
    messageClass: string,
    message: SequenceMessage,
  ) => ReactNode;
  renderMeta?: (
    meta: Record<string, string | number>,
    message: SequenceMessage,
  ) => ReactNode;
}) {
  const { sequence, controller } = useSequenceContext();
  const expanded = sequence.actors.filter(
    (actor) =>
      actor.embeddedSequence && !controller.state.collapsedActors.has(actor.id),
  );

  if (!expanded.length) return null;

  const panelHeight = 280;

  return (
    <div className="relative mt-6" style={{ height: panelHeight }}>
      {expanded.map((actor) => (
        <div
          key={actor.id}
          className="absolute z-10 -translate-x-1/2 transform"
          style={{
            left: `${layout.actorPositions[actor.id] ?? 0}%`,
            width: "340px",
          }}
        >
          <div className="rounded-lg border bg-background shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                Nested: {renderActorLabel ? renderActorLabel(actor) : actor.label}
                <Badge variant="secondary" className="text-[11px]">
                  {actor.embeddedSequence?.label ?? actor.embeddedSequence?.id}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={() => controller.api.collapseActor(actor.id)}
              >
                Collapse
              </Button>
            </div>
            <div className="p-2">
              <SequenceDiagram
                sequence={actor.embeddedSequence as Sequence}
                height={200}
                showLegend={false}
                renderActorLabel={renderActorLabel}
                renderMessageClass={renderMessageClass}
                renderMeta={renderMeta}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActorLane({
  actor,
  layout,
}: {
  actor: SequenceActor;
  layout: SequenceLayout;
}) {
  const { controller } = useSequenceContext();
  const { highlight, styles } = controller.state;
  const isHighlighted = highlight.actors.has(actor.id);
  const x = layout.actorPositions[actor.id] ?? 0;

  return (
    <div
      className="absolute top-0 flex h-full w-0.5 -translate-x-1/2 transform items-start justify-center"
      style={{ left: `${x}%` }}
    >
      <div
        className={cn(
          "h-full w-0.5 rounded-full bg-border",
          actor.laneClassName,
          styles.actors[actor.id],
          isHighlighted && "bg-primary/50 shadow-[0_0_0_2px_rgba(59,130,246,0.35)]",
        )}
        aria-hidden
      />
    </div>
  );
}

export function MessageEdge({
  message,
  layout,
  sequenceId,
  renderMessageClass,
  renderMeta,
}: {
  message: SequenceMessage;
  layout: SequenceLayout;
  sequenceId: string;
  renderMessageClass?: (
    messageClass: string,
    message: SequenceMessage,
  ) => ReactNode;
  renderMeta?: (
    meta: Record<string, string | number>,
    message: SequenceMessage,
  ) => ReactNode;
}) {
  const { controller } = useSequenceContext();
  const { highlight, styles } = controller.state;
  const pos = layout.messagePositions[message.id];

  if (!pos) return null;

  const left = Math.min(pos.fromX, pos.toX);
  const width = Math.max(Math.abs(pos.toX - pos.fromX), 8);
  const leftToRight = pos.toX >= pos.fromX;
  const active =
    highlight.messages.has(message.id) ||
    (message.messageClass && highlight.messageClasses.has(message.messageClass)) ||
    highlight.actors.has(message.from) ||
    highlight.actors.has(message.to) ||
    highlight.sequences.has(sequenceId);

  return (
    <div
      className={cn(
        "absolute flex flex-col gap-2 rounded-lg border bg-white/85 px-3 py-2 text-sm shadow-sm backdrop-blur transition",
        message.className,
        styles.messages[message.id],
        message.messageClass
          ? styles.messageClasses[message.messageClass]
          : undefined,
        active && "ring-2 ring-primary/60 shadow-md bg-primary/5",
      )}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: pos.y,
      }}
      data-message-id={message.id}
    >
      <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-semibold text-foreground">
          {message.label}
        </span>
        {message.messageClass && (
          renderMessageClass ? (
            renderMessageClass(message.messageClass, message)
          ) : (
            <Badge variant="outline">{message.messageClass}</Badge>
          )
        )}
        <span className="ml-auto flex items-center gap-1 text-[11px] uppercase tracking-wide">
          {message.kind ?? "sync"}
        </span>
      </div>
      {message.description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {message.description}
        </p>
      )}
      {message.meta && (
        <>
          {renderMeta ? (
            renderMeta(message.meta, message)
          ) : (
            <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
              {Object.entries(message.meta).map(([key, value]) => (
                <Badge key={key} variant="outline" className="bg-muted/40">
                  <span className="font-semibold">{key}:</span> {String(value)}
                </Badge>
              ))}
            </div>
          )}
        </>
      )}
      <div className="relative mt-1 h-1.5 w-full">
        <div
          className={cn(
            "absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full",
            lineForKind(pos.kind),
          )}
          style={{ width: "100%" }}
          aria-hidden
        >
          <ArrowRight
            className={cn(
              "absolute -right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground transition",
              !leftToRight && "rotate-180 left-0 right-auto",
            )}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{message.from}</span>
        <span>→</span>
        <span>{message.to}</span>
      </div>
    </div>
  );
}

function lineForKind(kind: string) {
  switch (kind) {
    case "async":
      return "bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200";
    case "return":
      return "bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200";
    case "note":
      return "bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200";
    default:
      return "bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200";
  }
}
