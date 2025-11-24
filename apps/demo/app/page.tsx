"use client";

import { useMemo } from "react";
import { Layers3, RefreshCw } from "lucide-react";

import {
  SequenceDiagram,
  useSequenceController,
  defineLeafDiagram,
  type ActorNode,
  type SequenceDiagramModel,
} from "seqdia";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

function collectActorIds(actors: ActorNode[]): string[] {
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
      toActorId: "auth",
      label: "Authenticate session",
      rowIndex: 1,
    },
    {
      messageId: "profile-lookup",
      fromActorId: "auth",
      toActorId: "database",
      label: "Load profile",
      rowIndex: 2,
    },
    {
      messageId: "profile-return",
      fromActorId: "database",
      toActorId: "auth",
      label: "Profile ready",
      rowIndex: 3,
    },
    {
      messageId: "issue-session",
      fromActorId: "auth",
      toActorId: "session",
      label: "Issue tokens",
      rowIndex: 4,
    },
    {
      messageId: "audit-session",
      fromActorId: "session",
      toActorId: "audit",
      label: "Log session",
      rowIndex: 5,
    },
    {
      messageId: "audit-ack",
      fromActorId: "audit",
      toActorId: "auth",
      label: "Ack auth",
      rowIndex: 6,
    },
    {
      messageId: "auth-ok",
      fromActorId: "auth",
      toActorId: "frontend",
      label: "Auth complete",
      rowIndex: 7,
    },
    {
      messageId: "intent",
      fromActorId: "frontend",
      toActorId: "payments",
      label: "Create intent",
      rowIndex: 8,
    },
    {
      messageId: "persist-intent",
      fromActorId: "payments",
      toActorId: "database",
      label: "Persist intent",
      rowIndex: 9,
    },
    {
      messageId: "intent-stored",
      fromActorId: "database",
      toActorId: "payments",
      label: "Intent stored",
      rowIndex: 10,
    },
    {
      messageId: "stripe-call",
      fromActorId: "payments",
      toActorId: "stripe",
      label: "Call Stripe",
      rowIndex: 11,
    },
    {
      messageId: "fraud-check",
      fromActorId: "stripe",
      toActorId: "fraud",
      label: "Share risk",
      rowIndex: 12,
    },
    {
      messageId: "fraud-return",
      fromActorId: "fraud",
      toActorId: "stripe",
      label: "Risk verdict",
      rowIndex: 13,
    },
    {
      messageId: "stripe-ok",
      fromActorId: "stripe",
      toActorId: "payments",
      label: "Stripe ok",
      rowIndex: 14,
    },
    {
      messageId: "confirm",
      fromActorId: "payments",
      toActorId: "frontend",
      label: "Confirm payment",
      rowIndex: 15,
    },
    {
      messageId: "render",
      fromActorId: "frontend",
      toActorId: "browser",
      label: "Render receipt",
      rowIndex: 16,
    },
  ] as const,
});

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">SeqDia</p>
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
                Tree-driven sequence diagrams for React + Tailwind
              </h1>
              <p className="text-sm text-muted-foreground">
                Columns come from visible leaves. Expand nodes anywhere to
                reshape the grid and recompute anchors.
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" />
              Arbitrary depth
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={highlightHappyPath} variant="default">
              Highlight happy path
            </Button>
            <Button onClick={spotlightInfra} variant="outline">
              Highlight backend actors
            </Button>
            <Button onClick={expandAll} variant="secondary">
              Expand everything
            </Button>
            <Button onClick={collapseNested} variant="outline">
              Collapse auth + payments
            </Button>
            <Button onClick={clear} variant="ghost">
              <RefreshCw className="mr-1 h-4 w-4" />
              Clear highlight/selection
            </Button>
          </div>
        </header>

        <Card className="overflow-hidden border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              Checkout orchestration
            </CardTitle>
            <CardDescription>
              Expand groups to reroute messages to their leaf actors; rails hide when expanded.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <SequenceDiagram model={checkoutModel} controller={controller} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What you get</CardTitle>
            <CardDescription>
              Expandable groups, leaf-only message anchors, and highlight/selection APIs.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-foreground text-sm font-semibold">
                End-user features
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Expand/collapse any branch; columns recompute from visible leaves.</li>
                <li>Grouping rails hide when expanded; messages reroute to leaf actors.</li>
                <li>Highlight or select actors/messages with your own styling.</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-muted-foreground">
{`controller.highlightMessages(["intent", "confirm"]);
controller.collapseActor("payments");
controller.toggleActorExpansion("auth");`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Library usage</CardTitle>
            <CardDescription>
              Install `seqdia` in any React + Tailwind app and render the
              tree-based diagram. The Next.js app here is only the demo shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="text-foreground text-sm font-semibold">
                Install
              </p>
              <pre className="rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-100">
{`pnpm add seqdia react react-dom
pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot`}
              </pre>
              <p className="text-foreground text-sm font-semibold">
                Import and render
              </p>
              <p>
                Use `defineLeafDiagram` to ensure messages only target leaf
                actors. Grouping nodes vanish as rails when expanded.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-muted-foreground">
{`import { SequenceDiagram, useSequenceController, defineLeafDiagram } from "seqdia";

const model = defineLeafDiagram({
  actors: [{ actorId: "a", label: "Service A" }, { actorId: "b", label: "Service B" }],
  messages: [{ messageId: "m1", fromActorId: "a", toActorId: "b", label: "Call" }],
});

export function Simple() {
  const controller = useSequenceController(model);
  return <SequenceDiagram model={model} controller={controller} />;
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compose your own layout</CardTitle>
            <CardDescription>
              Using the exposed layers and layout hook; swap in your own shells/styles.
            </CardDescription>
          </CardHeader>
          <CardContent className="rounded-lg border bg-muted/40 p-4 text-xs">
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-muted-foreground">
{`import {
  HeaderGrid,
  RegionsLayer,
  RailsLayer,
  MessagesLayer,
  useSequenceLayout,
  useSequenceController,
  defineLeafDiagram,
} from "seqdia";

const model = defineLeafDiagram({ /* actors/messages */ });
const controller = useSequenceController(model);
const { layout, actorColors, actorBackgrounds, resolvedMessages, activeActors } =
  useSequenceLayout(model, controller);

return (
  <div style={{ minWidth: layout.leafCount * 140 }}>
    <HeaderGrid
      layout={{ ...layout, gridTemplate: "repeat(${layout.leafCount}, 140px)" }}
      actorColors={actorColors}
      actorBackgrounds={actorBackgrounds}
    />
    <div className="relative" style={{ height: layout.messageAreaHeight }}>
      <RegionsLayer layout={layout} actorColors={actorColors} actorBackgrounds={actorBackgrounds} />
      <RailsLayer layout={layout} actorColors={actorColors} activeActors={activeActors} />
      <MessagesLayer resolvedMessages={resolvedMessages} />
    </div>
  </div>
);`}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
