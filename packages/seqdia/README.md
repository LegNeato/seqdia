# SeqDia — Sequence Diagrams for React

Interactive, collapsible sequence diagrams with hierarchical actor grouping.

**[Live Demo](https://legneato.github.io/seqdia/)** · [GitHub](https://github.com/LegNeato/seqdia)

## Features

- **Hierarchical actors** — Group actors into collapsible nodes; columns recompute from visible leaves
- **Customizable rendering** — Use render props to fully customize actors, messages, and layers
- **Selection & highlighting** — Built-in APIs for programmatic and interactive highlighting
- **Type-safe models** — `defineLeafDiagram` validates message endpoints at compile time

## Install

```bash
pnpm add seqdia
```

Requires `react` and `react-dom` (^18 or ^19) as peer dependencies. Tailwind CSS is expected for styling.

## Quick Start

```tsx
import {
  SequenceDiagram,
  useSequenceController,
  defineLeafDiagram,
} from "seqdia";

const model = defineLeafDiagram({
  actors: [
    { actorId: "client", label: "Client" },
    { actorId: "server", label: "Server" },
  ],
  messages: [
    { messageId: "req", fromActorId: "client", toActorId: "server", label: "Request" },
    { messageId: "res", fromActorId: "server", toActorId: "client", label: "Response" },
  ],
});

function Diagram() {
  const controller = useSequenceController(model);
  return <SequenceDiagram model={model} controller={controller} />;
}
```

## Hierarchical Actors

Actors can contain children. When a parent is collapsed, messages route to the parent; when expanded, they route to leaf children.

```tsx
const model = defineLeafDiagram({
  actors: [
    { actorId: "client", label: "Client" },
    {
      actorId: "backend",
      label: "Backend",
      defaultExpanded: false,
      children: [
        { actorId: "api", label: "API" },
        { actorId: "db", label: "Database" },
      ],
    },
  ],
  messages: [
    { messageId: "m1", fromActorId: "client", toActorId: "api", label: "Call API" },
    { messageId: "m2", fromActorId: "api", toActorId: "db", label: "Query" },
  ],
});
```

## Controller API

The controller manages expansion state, highlighting, and selection:

```tsx
const controller = useSequenceController(model);

// Expansion
controller.expandActor("backend");
controller.collapseActor("backend");
controller.toggleActorExpansion("backend");

// Highlighting (visual emphasis, typically on hover)
controller.highlightActors(["api", "db"]);
controller.highlightMessages(["m1", "m2"]);
controller.clearHighlights();

// Selection (persistent state, typically on click)
controller.selectActors("client");
controller.selectMessages(["m1"]);
controller.clearSelection();
```

## Custom Rendering

Override the default rendering with `renderActor` and `renderMessage`:

```tsx
<SequenceDiagram
  model={model}
  controller={controller}
  renderActor={({ actor, buttonProps, highlighted, selected }) => (
    <button
      {...buttonProps}
      className={cn(
        "rounded border px-3 py-2 text-sm font-medium",
        highlighted && "ring-2 ring-blue-500",
        selected && "bg-blue-50",
      )}
    >
      {actor.label}
    </button>
  )}
  renderMessage={({ resolved, messageProps, highlighted }) => (
    <div {...messageProps} className="flex items-center gap-2">
      <span>{resolved.message.label}</span>
    </div>
  )}
/>
```

## Styling

Use `getActorStyle` and `getMessageStyle` to provide colors per actor/message:

```tsx
<SequenceDiagram
  model={model}
  controller={controller}
  getActorStyle={(actor) => ({
    color: actor.actorId === "client" ? "#3b82f6" : "#10b981",
  })}
  getMessageStyle={(message) => ({
    strokeColor: "#6366f1",
  })}
/>
```

## Event Callbacks

```tsx
<SequenceDiagram
  model={model}
  controller={controller}
  onActorClick={(actorId) => console.log("Clicked:", actorId)}
  onMessageClick={(messageId) => console.log("Clicked:", messageId)}
  onSelectionChange={(selection) => console.log("Selection:", selection)}
  onHighlightChange={(highlight) => console.log("Highlight:", highlight)}
/>
```

## Running the Demo Locally

```bash
git clone https://github.com/LegNeato/seqdia.git
cd seqdia
pnpm install
pnpm dev       # runs demo app at http://localhost:3000
```

## License

Dual-licensed under [MIT](LICENSE-MIT) and [Apache-2.0](LICENSE-APACHE). Choose whichever fits your project.
