# SeqDia

Interactive, hook-first sequence diagrams for React/Next.js with Tailwind, shadcn/ui styling, and optional D3 spacing. It is built to be composed: highlight any actor/message/class from code, override styles at runtime, and expand nested actors into embedded sequences.

## Highlights

- Hook-driven control surface (`useSequenceController`, `useSequenceApi`) with functions to highlight or style actors, messages, message classes, or entire sequences.
- Composable primitives powered by Tailwind + shadcn/ui; bring your own layout or drop in `SequenceDiagram`.
- Nested actors: attach an embedded `Sequence` to an actor and expand/collapse on demand.
- Message class theming: style by arbitrary class names (no built-ins) or per message/actor via `setMessageClassStyle`.
- Render props for actor labels, message class badges, and metadata so you can provide your own React components.
- Tested with Vitest + Testing Library; layout spacing uses `d3-scale` under the hood.
- Dual-licensed MIT or Apache-2.0 for OSS compatibility.

## Quick start

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

## Usage

Define your data and drive the diagram with the controller:

```tsx
import { SequenceDiagram } from "@/components/sequence/SequenceDiagram";
import { useSequenceController } from "@/hooks/useSequenceController";
import type { Sequence } from "@/lib/sequence/types";

const sequence: Sequence = {
  id: "checkout",
  label: "Checkout orchestration",
  actors: [
    { id: "client", label: "Client" },
    {
      id: "payments",
      label: "Payments",
      embeddedSequence: {
        id: "payments-sub",
        actors: [
          { id: "payments", label: "Payments" },
          { id: "stripe", label: "Stripe" },
        ],
        messages: [
          { id: "sub-1", from: "payments", to: "stripe", label: "Create intent", messageClass: "info" },
        ],
      },
      defaultCollapsed: true,
    },
    { id: "db", label: "DB" },
  ],
  messages: [
    { id: "m1", from: "client", to: "payments", label: "Init", messageClass: "info" },
    { id: "m2", from: "payments", to: "db", label: "Persist intent", messageClass: "warning", kind: "async" },
  ],
};

export function CheckoutDiagram() {
  const controller = useSequenceController(sequence);

  return (
    <>
      <button onClick={() => controller.api.highlightMessageClass("warning")}>
        Highlight warnings
      </button>
      <SequenceDiagram sequence={sequence} controller={controller} />
    </>
  );
}
```

### Controller API (selected)

- `highlightActor(id | id[])`, `highlightMessage(id | id[])`, `highlightMessageClass(name | name[])`, `highlightSequence(id | id[])`
- `clearHighlights()`
- `setActorStyle(id, className)`, `setMessageStyle(id, className)`, `setMessageClassStyle(name, className)`, `setSequenceStyle(id, className)`
- `toggleActor(id)`, `expandActor(id)`, `collapseActor(id)`

For components nested under `SequenceDiagram`, use `useSequenceApi(onReady?)` to grab the same API without manually passing the controller.

### Types

See `src/lib/sequence/types.ts` for `Sequence`, `SequenceActor`, and `SequenceMessage` definitions. Every message can carry a `messageClass`, `kind` (`sync | async | return | note`), optional `description`, and `meta` map.

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
