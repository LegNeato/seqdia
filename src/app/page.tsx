"use client";

import { useEffect } from "react";
import { Layers3, RefreshCw } from "lucide-react";

import { SequenceDiagram } from "@/components/sequence/SequenceDiagram";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSequenceController } from "@/hooks/useSequenceController";
import { type Sequence } from "@/lib/sequence/types";

const paymentsSubsequence: Sequence = {
  id: "payments-subflow",
  label: "Payments orchestration",
  description: "Nested inside the Payments actor.",
  actors: [
    { id: "payments", label: "Payments service" },
    { id: "stripe", label: "Stripe" },
    { id: "fraud", label: "Fraud checker" },
  ],
  messages: [
    {
      id: "pay-intent",
      from: "payments",
      to: "stripe",
      label: "Create intent",
      messageClass: "info",
      meta: { provider: "stripe" },
    },
    {
      id: "pay-risk",
      from: "stripe",
      to: "fraud",
      label: "Share risk",
      messageClass: "warning",
      kind: "async",
      description: "Stripe hands off fraud data for a second opinion.",
    },
    {
      id: "pay-risk-return",
      from: "fraud",
      to: "payments",
      label: "Risk evaluation",
      messageClass: "info",
      kind: "return",
    },
    {
      id: "pay-capture",
      from: "payments",
      to: "stripe",
      label: "Capture funds",
      messageClass: "success",
      kind: "sync",
      meta: { capture: "manual" },
    },
  ],
};

const authSubsequence: Sequence = {
  id: "auth-subflow",
  label: "Auth session workflow",
  description: "Logged under the Auth actor.",
  actors: [
    { id: "auth", label: "Auth service" },
    { id: "session", label: "Session issuer" },
    { id: "audit", label: "Audit log" },
  ],
  messages: [
    {
      id: "auth-issue",
      from: "auth",
      to: "session",
      label: "Issue session",
      messageClass: "success",
    },
    {
      id: "session-audit",
      from: "session",
      to: "audit",
      label: "Log success",
      messageClass: "info",
      kind: "async",
    },
    {
      id: "audit-ack",
      from: "audit",
      to: "auth",
      label: "Ack audit",
      messageClass: "info",
      kind: "return",
    },
  ],
};

const checkoutSequence: Sequence = {
  id: "checkout-sequence",
  label: "Checkout orchestration",
  description:
    "Composable diagram with API-driven highlighting, styling, and nested actors.",
  actors: [
    { id: "browser", label: "User browser" },
    { id: "frontend", label: "Web app", subtitle: "Next.js" },
    {
      id: "auth",
      label: "Auth service",
      subtitle: "OpenID Connect",
      embeddedSequence: authSubsequence,
      defaultCollapsed: true,
    },
    {
      id: "payments",
      label: "Payments",
      subtitle: "Orchestrator",
      embeddedSequence: paymentsSubsequence,
      defaultCollapsed: true,
    },
    { id: "database", label: "Database", subtitle: "Postgres 16" },
  ],
  messages: [
    {
      id: "start-checkout",
      from: "browser",
      to: "frontend",
      label: "Start checkout",
      messageClass: "info",
      meta: { path: "/checkout" },
    },
    {
      id: "auth-session",
      from: "frontend",
      to: "auth",
      label: "Authenticate session",
      messageClass: "success",
      kind: "sync",
      meta: { latency: "110ms" },
    },
    {
      id: "profile-lookup",
      from: "auth",
      to: "database",
      label: "Load profile",
      messageClass: "success",
      kind: "async",
    },
    {
      id: "profile-response",
      from: "database",
      to: "auth",
      label: "Profile ready",
      messageClass: "success",
      kind: "return",
    },
    {
      id: "create-intent",
      from: "frontend",
      to: "payments",
      label: "Create intent",
      messageClass: "info",
    },
    {
      id: "persist-intent",
      from: "payments",
      to: "database",
      label: "Persist intent",
      description: "Use async queue if replication lags.",
      messageClass: "warning",
      kind: "async",
      meta: { retries: 1 },
    },
    {
      id: "persisted",
      from: "database",
      to: "payments",
      label: "Intent persisted",
      messageClass: "info",
      kind: "return",
    },
    {
      id: "notify-auth",
      from: "payments",
      to: "auth",
      label: "Notify auth of instrument",
      messageClass: "info",
      kind: "async",
    },
    {
      id: "confirm",
      from: "payments",
      to: "frontend",
      label: "Confirm payment",
      messageClass: "success",
      kind: "sync",
    },
    {
      id: "receipt",
      from: "frontend",
      to: "browser",
      label: "Render receipt",
      messageClass: "success",
      kind: "return",
    },
  ],
};

export default function Home() {
  const controller = useSequenceController(checkoutSequence);

  useEffect(() => {
    controller.api.setMessageClassStyle(
      "warning",
      "border-amber-300 bg-amber-50/90",
    );
    controller.api.setMessageClassStyle(
      "success",
      "border-emerald-300 bg-emerald-50/80",
    );
    controller.api.setMessageClassStyle("info", "border-blue-200 bg-blue-50");
    controller.api.setActorStyle("database", "bg-slate-50");
    controller.api.setSequenceStyle(
      checkoutSequence.id,
      "bg-gradient-to-br from-white via-slate-50 to-blue-50",
    );
  }, [controller.api]);

  const highlightHappyPath = () =>
    controller.api.highlightMessage([
      "auth-session",
      "profile-lookup",
      "profile-response",
      "create-intent",
      "persist-intent",
      "confirm",
      "receipt",
    ]);

  const highlightWarnings = () => controller.api.highlightMessageClass("warning");
  const highlightDatabase = () => controller.api.highlightActor("database");
  const expandPayments = () => controller.api.expandActor("payments");
  const collapsePayments = () => controller.api.collapseActor("payments");
  const clear = () => controller.api.clearHighlights();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <main className="container flex max-w-5xl flex-col gap-8 py-12">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">SeqDia</p>
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
                Interactive, composable sequence diagrams for product engineers
              </h1>
              <p className="text-sm text-muted-foreground">
                Highlight flows, recolor message classes, and open nested
                sequences with a tiny hook-first API.
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" />
              Nested actors
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={highlightHappyPath} variant="default">
              Highlight checkout path
            </Button>
            <Button onClick={highlightWarnings} variant="outline">
              Highlight warnings
            </Button>
            <Button onClick={highlightDatabase} variant="secondary">
              Spotlight database actor
            </Button>
            <Button onClick={expandPayments} variant="outline">
              Expand payments
            </Button>
            <Button onClick={collapsePayments} variant="outline">
              Collapse payments
            </Button>
            <Button onClick={clear} variant="ghost">
              <RefreshCw className="mr-1 h-4 w-4" />
              Clear highlights
            </Button>
          </div>
        </header>

        <SequenceDiagram sequence={checkoutSequence} controller={controller} />

        <Card>
          <CardHeader>
            <CardTitle>Composable control surface</CardTitle>
            <CardDescription>
              The same diagram is driven by the exposed API so you can plug it
              into analytics, traces, or toggles.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-foreground font-semibold text-sm">
                Available actions
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Highlight actors, messages, message classes, or sequences.</li>
                <li>Apply custom classNames per actor/message/class.</li>
                <li>Toggle embedded sequences per actor with one call.</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-muted-foreground">
{`controller.api.highlightMessage(["persist-intent"]);
controller.api.highlightMessageClass("warning");
controller.api.setMessageClassStyle("warning", "border-amber-400 bg-amber-50");
controller.api.expandActor("payments");`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
