# SeqDia (library)

React/Tailwind components for tree-based sequence diagrams. Works in any React app; the Next.js app in this repo is only the demo shell.

## Install

```bash
pnpm add seqdia react react-dom
```

## Usage

```tsx
import {
  SequenceDiagram,
  useSequenceController,
  defineLeafDiagram,
  type SequenceDiagramModel,
} from "seqdia";

const model: SequenceDiagramModel = defineLeafDiagram({
  title: "Example",
  actors: [
    { actorId: "a", label: "Service A" },
    { actorId: "b", label: "Service B" },
  ],
  messages: [
    { messageId: "m1", fromActorId: "a", toActorId: "b", label: "Call" },
  ],
});

export function Diagram() {
  const controller = useSequenceController(model);
  return <SequenceDiagram model={model} controller={controller} />;
}
```

Key helpers:

- `defineLeafDiagram` ensures messages target leaf actors (grouping nodes are view-only).
- `defineLinearDiagram` enforces a continuous message chain.
- `deriveVisibleMessages` maps canonical leaf messages to the current expanded/collapsed view.
- `HeaderGrid`, `RegionsLayer`, `RailsLayer`, `MessagesLayer`, and `useSequenceLayout` let you compose your own surface with custom shells/styling.

> Tailwind (or equivalent CSS) is expected in the consumer app so the utility classes render; the library does not ship UI wrappers.

## Scripts

- `pnpm lint`
- `pnpm test`

## License

MIT OR Apache-2.0
