# SeqDia

Tree-first sequence diagrams for React + Tailwind. Actor labels live in a tree, spans derive from visible leaves, and the diagram renders with layered React components. The Next.js app in this repo is just the demo shell; the components/hooks work in any React project.

## Highlights

- Tree labels with arbitrary depth; header rows per depth and spans from visible leaves.
- Regions for expanded nodes; single anchor lines for collapsed nodes and leaves using plain `<div>` rails.
- Messages hide when endpoints (or their ancestors) are collapsed; anchors recompute on every expand/collapse.
- Hook-first control surface (`useSequenceController`, `useSequenceApi`) for highlight, selection, and expansion.
- Render props for actor labels and message labels to plug in your own UI.
- Tested with Vitest + Testing Library.

## Quick start

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

## Install

```bash
pnpm install
# if you want the demo styling:
pnpm add shadcn/ui lucide-react
```

The shadcn/ui bits are only used on the example page—you can swap them for your own UI components.

## Usage

Define your data and drive the diagram with the controller:

```tsx
import { SequenceDiagram } from "@/components/sequence/SequenceDiagram";
import { useSequenceController } from "@/hooks/useSequenceController";
import { defineLeafDiagram, type SequenceDiagramModel } from "@/lib/sequence/types";

const model: SequenceDiagramModel = defineLeafDiagram({
  title: "Checkout orchestration",
  actors: [
    {
      actorId: "checkout",
      label: "Checkout",
      defaultExpanded: true,
      children: [
        { actorId: "browser", label: "Browser" },
        { actorId: "frontend", label: "Frontend" },
        {
          actorId: "services",
          label: "Services",
          children: [
            { actorId: "auth", label: "Auth" },
            { actorId: "payments", label: "Payments" },
          ],
        },
      ],
    },
  ],
  messages: [
    { messageId: "m1", fromActorId: "browser", toActorId: "frontend", label: "Start" },
    { messageId: "m2", fromActorId: "frontend", toActorId: "auth", label: "Authenticate" },
    { messageId: "m3", fromActorId: "frontend", toActorId: "payments", label: "Create intent" },
  ],
});

export function CheckoutDiagram() {
  const controller = useSequenceController(model);

  return (
    <>
      <button onClick={() => controller.api.highlightMessages(["m2", "m3"])}>
        Highlight backend calls
      </button>
      <SequenceDiagram model={model} controller={controller} />
    </>
  );
}
```

### Controller API (selected)

- `highlightActors(id | id[])`, `highlightMessages(id | id[])`, `clearHighlights()`
- `selectActors(id | id[])`, `selectMessages(id | id[])`, `clearSelection()`
- `toggleActorExpansion(id)`, `expandActor(id)`, `collapseActor(id)`, `setExpandedActors(set)`

For components nested under `SequenceDiagram`, use `useSequenceApi(onReady?)` to grab the same API without manually passing the controller.

### Types and helpers

- `defineLeafDiagram` enforces that messages target leaf actors only (grouping actors are view-only).
- `LinearMessages`/`defineLinearDiagram` enforce a continuous message chain if you want that invariant.
- `VisibleMessage` + `deriveVisibleMessages` (see `src/lib/sequence/visible.ts`) help map your canonical leaf messages to the currently visible rolled-up view.

See `src/lib/sequence/types.ts` for `ActorNode`, `SequenceMessage`, and `SequenceDiagramModel` definitions. Messages carry arbitrary payload metadata.

## Using without Next.js

The components are plain React. To use outside Next:

1) Import from `src/components/sequence/*`, `src/hooks/*`, and `src/lib/sequence/*`.
2) Swap shadcn/ui wrappers (`Button`, `Card`, etc.) for your design system.
3) Keep or replace the Tailwind classes as needed.

## Testing

```bash
pnpm test        # vitest run
pnpm lint        # eslint
```

## License

Dual-licensed under MIT and Apache-2.0. Choose the license that fits your project:

- `LICENSE-MIT`
- `LICENSE-APACHE`

## Contributing

Issues and PRs are welcome. Keep changes covered with tests and update docs alongside new behaviors.
