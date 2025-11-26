"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";

import {
  SequenceDiagram,
  MessageArrow,
  MessageLabel,
  useSequenceController,
  defineLeafDiagram,
  type ActorNode,
  type SequenceDiagramModel,
  type VisibleActor,
  type SequenceMessage,
  type ActorRenderProps,
  type MessageRenderProps,
} from "seqdia";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CodeBlock } from "../components/ui/code-block";
import { cn } from "../lib/utils";

function collectActorIds(actors: readonly ActorNode[]): string[] {
  return actors.flatMap((actor) => [
    actor.actorId,
    ...collectActorIds(actor.children ?? []),
  ]);
}

const checkoutModel: SequenceDiagramModel = defineLeafDiagram({
  id: "checkout-sequence",
  title: "Checkout orchestration",
  description:
    "Tree-based labels drive the header grid, regions, and visible columns.",
  actors: [
    { actorId: "browser", label: "User browser", alignment: "left" },
    { actorId: "frontend", label: "Next.js frontend" },
    {
      actorId: "auth",
      label: "Auth stack",
      defaultExpanded: false,
      children: [
        { actorId: "session", label: "Session issuer" },
        { actorId: "audit", label: "Audit log" },
      ],
    },
    {
      actorId: "payments",
      label: "Payments",
      defaultExpanded: false,
      alignment: "center",
      children: [
        { actorId: "orchestrator", label: "Orchestrator" },
        { actorId: "stripe", label: "Stripe" },
        { actorId: "fraud", label: "Fraud checker" },
      ],
    },
    { actorId: "database", label: "Postgres 16", alignment: "right" },
  ],
  messages: [
    {
      messageId: "start-checkout",
      fromActorId: "browser",
      toActorId: "frontend",
      label: "Start checkout",
      rowIndex: 0,
    },
    {
      messageId: "auth-session",
      fromActorId: "frontend",
      toActorId: "session",
      label: "Authenticate",
      rowIndex: 1,
    },
    {
      messageId: "profile-lookup",
      fromActorId: "session",
      toActorId: "database",
      label: "Load profile",
      rowIndex: 2,
    },
    {
      messageId: "profile-return",
      fromActorId: "database",
      toActorId: "session",
      label: "Profile ready",
      rowIndex: 3,
    },
    {
      messageId: "issue-session",
      fromActorId: "session",
      toActorId: "audit",
      label: "Log auth",
      rowIndex: 4,
    },
    {
      messageId: "audit-ack",
      fromActorId: "audit",
      toActorId: "frontend",
      label: "Auth complete",
      rowIndex: 5,
    },
    {
      messageId: "intent",
      fromActorId: "frontend",
      toActorId: "orchestrator",
      label: "Create intent",
      rowIndex: 6,
    },
    {
      messageId: "persist-intent",
      fromActorId: "orchestrator",
      toActorId: "database",
      label: "Persist intent",
      rowIndex: 7,
    },
    {
      messageId: "intent-stored",
      fromActorId: "database",
      toActorId: "orchestrator",
      label: "Intent stored",
      rowIndex: 8,
    },
    {
      messageId: "stripe-call",
      fromActorId: "orchestrator",
      toActorId: "stripe",
      label: "Call Stripe",
      rowIndex: 9,
    },
    {
      messageId: "fraud-check",
      fromActorId: "stripe",
      toActorId: "fraud",
      label: "Check risk",
      rowIndex: 10,
    },
    {
      messageId: "fraud-return",
      fromActorId: "fraud",
      toActorId: "stripe",
      label: "Risk ok",
      rowIndex: 11,
    },
    {
      messageId: "stripe-ok",
      fromActorId: "stripe",
      toActorId: "orchestrator",
      label: "Payment ok",
      rowIndex: 12,
    },
    {
      messageId: "confirm",
      fromActorId: "orchestrator",
      toActorId: "frontend",
      label: "Confirm",
      rowIndex: 13,
    },
    {
      messageId: "render",
      fromActorId: "frontend",
      toActorId: "browser",
      label: "Render receipt",
      rowIndex: 14,
    },
  ] as const,
} as const);

// Tailwind-based color palette using HSL for consistency with shadcn theme
const palette: Record<string, string> = {
  // Client layer - slate
  browser: "hsl(215 25% 27%)",
  // Frontend layer - blue
  frontend: "hsl(217 91% 60%)",
  // Auth group - violet spectrum
  auth: "hsl(258 90% 66%)",
  session: "hsl(258 90% 73%)",
  audit: "hsl(258 90% 82%)",
  // Payments group - emerald spectrum
  payments: "hsl(160 84% 39%)",
  orchestrator: "hsl(160 84% 52%)",
  stripe: "hsl(160 84% 67%)",
  fraud: "hsl(160 79% 79%)",
  // Database - amber
  database: "hsl(38 92% 50%)",
};

const getActorStyle = (actor: VisibleActor) => {
  const color = palette[actor.actorId] ?? "#111827";
  return {
    color,
    regionClassName: "rounded-lg border border-slate-200/60",
  };
};

const getMessageStyle = (message: SequenceMessage) => ({
  strokeColor: palette[message.fromActorId] ?? "#111827",
});

function renderActorButton({
  actor,
  buttonProps,
  highlighted,
  selected,
  label,
}: ActorRenderProps) {
  return (
    <button
      {...buttonProps}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold shadow-sm transition",
        highlighted && "ring-1 ring-blue-500 text-blue-600",
        selected && "ring-2 ring-blue-600 ring-offset-1",
      )}
    >
      {actor.hasChildren && (
        <span className="text-muted-foreground">
          {actor.expanded ? "▾" : "▸"}
        </span>
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

function renderMessageBubble({
  resolved,
  highlighted,
  selected,
  label,
  messageProps,
  style,
}: MessageRenderProps) {
  const stroke = style?.strokeColor ?? "#111827";
  return (
    <div
      {...messageProps}
      className={cn("group", messageProps.className)}
      style={{
        ...(messageProps.style ?? {}),
        cursor: "pointer",
      }}
    >
      <MessageArrow direction={resolved.direction} stroke={stroke} />
      <div className="pointer-events-none mt-1 flex w-full justify-center">
        <MessageLabel
          highlighted={highlighted}
          selected={selected}
          className={cn(
            "inline-flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-slate-200",
            highlighted && "ring-blue-500/60 text-blue-600",
            selected && "ring-2 ring-blue-600",
          )}
        >
          <span className="max-w-[260px] truncate">{label}</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {resolved.fromResolved.actorId} → {resolved.toResolved.actorId}
          </span>
        </MessageLabel>
      </div>
    </div>
  );
}

export default function Home() {
  const controller = useSequenceController(checkoutModel);
  const allActorIds = useMemo(
    () => new Set(collectActorIds(checkoutModel.actors)),
    [],
  );

  const highlightHappyPath = () =>
    controller.highlightMessages([
      "auth-session",
      "issue-session",
      "profile-lookup",
      "intent",
      "persist-intent",
      "stripe-call",
      "confirm",
      "render",
    ]);

  const spotlightInfra = () =>
    controller.highlightActors(["auth", "payments", "database"]);

  const expandAll = () => controller.setExpandedActors(allActorIds);
  const collapseNested = () => {
    controller.collapseActor("auth");
    controller.collapseActor("payments");
  };
  const clear = () => {
    controller.clearHighlights();
    controller.clearSelection();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <main className="container flex max-w-5xl flex-col gap-8 py-12">
        <header className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">SeqDia</p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
              Interactive sequence diagrams for React
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Model actors as a tree with collapsible groups. Messages route to visible leaves—expand
              a group to reveal child actors, collapse to roll messages up to the parent.
            </p>
          </div>
        </header>

        <Card className="overflow-hidden border-border/80">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  Live example
                </CardTitle>
                <CardDescription>
                  Click actor headers to expand/collapse groups. Try the controls to see highlighting and selection in action.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button onClick={highlightHappyPath} size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                  Highlight path
                </Button>
                <Button onClick={spotlightInfra} variant="outline" size="sm">
                  Highlight backend
                </Button>
                <Button onClick={expandAll} variant="outline" size="sm">
                  Expand all
                </Button>
                <Button onClick={collapseNested} variant="outline" size="sm">
                  Collapse groups
                </Button>
                <Button onClick={clear} variant="ghost" size="sm">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <SequenceDiagram
              model={checkoutModel}
              controller={controller}
              getActorStyle={getActorStyle}
              getMessageStyle={getMessageStyle}
              renderActor={renderActorButton}
              renderMessage={renderMessageBubble}
              className="overflow-hidden rounded-lg border border-border/80 bg-white shadow-sm p-4"
              headerClassName="grid gap-2 border-b border-border/80 bg-white py-3 px-2"
              canvasClassName="relative bg-white py-4"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick start</CardTitle>
            <CardDescription>
              Install and render a diagram in minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="text-foreground font-semibold mb-1">Install</p>
                <pre className="rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-100">
                  pnpm add seqdia
                </pre>
              </div>
              <p className="text-xs">
                Requires <code className="text-[11px] bg-muted px-1 rounded">react</code> and <code className="text-[11px] bg-muted px-1 rounded">react-dom</code> as peer dependencies.
                Tailwind CSS is expected for styling.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 overflow-x-auto">
              <CodeBlock code={`import {
  SequenceDiagram,
  useSequenceController,
  defineLeafDiagram,
} from "seqdia";

const model = defineLeafDiagram({
  actors: [
    { actorId: "a", label: "Service A" },
    { actorId: "b", label: "Service B" },
  ],
  messages: [
    { messageId: "m1", fromActorId: "a",
      toActorId: "b", label: "Request" },
  ],
});

function Diagram() {
  const controller = useSequenceController(model);
  return (
    <SequenceDiagram
      model={model}
      controller={controller}
    />
  );
}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controller API</CardTitle>
            <CardDescription>
              The controller manages diagram state. Create one with <code className="bg-muted px-1 rounded text-xs">useSequenceController(model)</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Expansion</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">expandActor(id)</code></li>
                  <li><code className="bg-muted px-1 rounded">collapseActor(id)</code></li>
                  <li><code className="bg-muted px-1 rounded">toggleActorExpansion(id)</code></li>
                  <li><code className="bg-muted px-1 rounded">setExpandedActors(Set)</code></li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Highlighting</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">highlightActors(ids)</code></li>
                  <li><code className="bg-muted px-1 rounded">highlightMessages(ids)</code></li>
                  <li><code className="bg-muted px-1 rounded">clearHighlights()</code></li>
                </ul>
                <p className="text-[11px] text-muted-foreground/70">Transient emphasis, typically on hover</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Selection</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li><code className="bg-muted px-1 rounded">selectActors(ids)</code></li>
                  <li><code className="bg-muted px-1 rounded">selectMessages(ids)</code></li>
                  <li><code className="bg-muted px-1 rounded">toggleActorSelection(id)</code></li>
                  <li><code className="bg-muted px-1 rounded">toggleMessageSelection(id)</code></li>
                  <li><code className="bg-muted px-1 rounded">clearSelection()</code></li>
                </ul>
                <p className="text-[11px] text-muted-foreground/70">Persistent state, typically on click</p>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 overflow-x-auto">
              <CodeBlock code={`const controller = useSequenceController(model);

// Expand/collapse groups
controller.expandActor("auth");
controller.collapseActor("payments");
controller.toggleActorExpansion("auth");

// Highlight actors or messages (visual emphasis)
controller.highlightActors(["auth", "payments"]);
controller.highlightMessages(["auth-session", "intent"]);
controller.clearHighlights();

// Select actors or messages (persistent state)
controller.selectMessages(["confirm"]);
controller.toggleActorSelection("database");
controller.clearSelection();

// Access current state
const { highlight, selection, expandedActors } = controller.state;`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom rendering</CardTitle>
            <CardDescription>
              Use render props to fully customize actors and messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="rounded-lg border bg-muted/40 p-4 overflow-x-auto">
            <CodeBlock code={`<SequenceDiagram
  model={model}
  controller={controller}
  getActorStyle={(actor) => ({
    color: palette[actor.actorId],
  })}
  getMessageStyle={(message) => ({
    strokeColor: palette[message.fromActorId],
  })}
  renderActor={({ actor, buttonProps, highlighted }) => (
    <button {...buttonProps} className={cn("btn", highlighted && "ring-2")}>
      {actor.label}
    </button>
  )}
  renderMessage={({ resolved, messageProps }) => (
    <div {...messageProps}>
      <MessageArrow direction={resolved.direction} stroke="#333" />
      <span>{resolved.message.label}</span>
    </div>
  )}
  onActorClick={(id) => console.log("Actor:", id)}
  onMessageClick={(id) => console.log("Message:", id)}
/>`} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
