"use client";

import { useMemo } from "react";
import { Layers3, RefreshCw } from "lucide-react";

import { SequenceDiagram } from "@/components/sequence/SequenceDiagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSequenceController } from "@/hooks/useSequenceController";
import {
  type ActorNode,
  type SequenceDiagramModel,
} from "@/lib/sequence/types";

function collectActorIds(actors: ActorNode[]): string[] {
  return actors.flatMap((actor) => [
    actor.actorId,
    ...collectActorIds(actor.children ?? []),
  ]);
}

const checkoutModel: SequenceDiagramModel = {
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
  ],
};

export default function Home() {
  const controller = useSequenceController(checkoutModel);
  const allActorIds = useMemo(
    () => new Set(collectActorIds(checkoutModel.actors)),
    [],
  );

  const highlightHappyPath = () =>
    controller.api.highlightMessages([
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
    controller.api.highlightActors(["auth", "payments", "database"]);

  const expandAll = () => controller.api.setExpandedActors(allActorIds);
  const collapseNested = () => {
    controller.api.collapseActor("auth");
    controller.api.collapseActor("payments");
  };
  const clear = () => {
    controller.api.clearHighlights();
    controller.api.clearSelection();
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

        <SequenceDiagram model={checkoutModel} controller={controller} />

        <Card>
          <CardHeader>
            <CardTitle>Behaviors from the PRD</CardTitle>
            <CardDescription>
              Column count follows visible leaves. Messages disappear when
              endpoints or ancestors are collapsed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-foreground text-sm font-semibold">
                Layout rules demonstrated
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Header rows per depth with spans based on visible leaves.</li>
                <li>Region boundaries for expanded nodes; single lines for collapsed nodes.</li>
                <li>Messages hide when endpoints or ancestors are not visible.</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-muted-foreground">
{`controller.api.highlightMessages(["intent", "confirm"]);
controller.api.collapseActor("payments");
controller.api.toggleActorExpansion("auth");`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
