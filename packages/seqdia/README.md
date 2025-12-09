# SeqDia — Sequence Diagrams for React

[![npm version](https://img.shields.io/npm/v/seqdia.svg)](https://www.npmjs.com/package/seqdia)

Interactive, collapsible sequence diagrams with hierarchical actor grouping.

**[Live Demo](https://legneato.github.io/seqdia/)** · [GitHub](https://github.com/LegNeato/seqdia)

## Features

- **Hierarchical actors** — Group actors into collapsible nodes; columns recompute from visible leaves
- **Customizable rendering** — Use render props to fully customize actors, messages, and layers
- **Selection & highlighting** — Built-in APIs for programmatic and interactive highlighting
- **Type-safe models** — `defineLeafDiagram` and `defineLinearDiagram` validate messages at compile time

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

## Type-Safe Model Builders

Two builder functions provide compile-time validation:

```tsx
import { defineLeafDiagram, defineLinearDiagram } from "seqdia";

// defineLeafDiagram: Validates that message endpoints reference valid actor IDs
const model1 = defineLeafDiagram({
  actors: [{ actorId: "a", label: "A" }, { actorId: "b", label: "B" }],
  messages: [
    { messageId: "m1", fromActorId: "a", toActorId: "b", label: "Hello" },
    // { messageId: "m2", fromActorId: "a", toActorId: "x", label: "Error" },
    // ^ TypeScript error: "x" is not a valid actor ID
  ],
});

// defineLinearDiagram: Validates that messages form a continuous chain
// (each message's fromActorId must equal the previous message's toActorId)
const model2 = defineLinearDiagram({
  actors: [{ actorId: "a", label: "A" }, { actorId: "b", label: "B" }],
  messages: [
    { messageId: "m1", fromActorId: "a", toActorId: "b", label: "Request" },
    { messageId: "m2", fromActorId: "b", toActorId: "a", label: "Response" },
    // { messageId: "m3", fromActorId: "b", toActorId: "a", label: "Error" },
    // ^ TypeScript error: chain broken, previous ended at "a" but this starts at "b"
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
controller.setExpandedActors(new Set(["backend", "frontend"]));

// Highlighting (visual emphasis, typically on hover)
controller.highlightActors(["api", "db"]);
controller.highlightMessages(["m1", "m2"]);
controller.clearHighlights();

// Selection (persistent state, typically on click)
controller.selectActors("client");
controller.selectMessages(["m1"]);
controller.toggleActorSelection("client");    // Toggle in/out of selection
controller.toggleMessageSelection("m1");      // Toggle in/out of selection
controller.clearSelection();

// Access current state
controller.state.expandedActors;  // Set<string>
controller.state.highlight;       // { actors: Set<string>, messages: Set<string> }
controller.state.selection;       // { actors: Set<string>, messages: Set<string> }
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

## Advanced: Hooks

For more control, use the individual hooks:

```tsx
import {
  useSequenceLayout,
  useSequenceInteractions,
  useSequenceApi,
  SequenceProvider,
} from "seqdia";

// Inside a SequenceProvider:
function CustomDiagram() {
  // Get layout data with resolved message positions
  const { layout, resolvedMessages, activeActors } = useSequenceLayout(model, controller);

  // Get interaction helpers (click, hover, selection state)
  const { getActorInteractions, getMessageInteractions } = useSequenceInteractions({
    selectActorsOnClick: true,
    highlightActorsOnHover: true,
    onSelectionChange: (selection) => console.log(selection),
  });

  // Access controller from context (when inside SequenceProvider)
  const controller = useSequenceApi();

  return (
    <div>
      {resolvedMessages.map((resolved) => (
        <div key={resolved.message.messageId}>
          {resolved.message.label}: {resolved.fromAnchor} → {resolved.toAnchor}
        </div>
      ))}
    </div>
  );
}
```

### ResolvedMessage

Messages are resolved with normalized anchor positions:

```tsx
type ResolvedMessage = {
  message: SequenceMessage;
  rowIndex: number;           // Row index (0-based)
  fromAnchor: number;         // Source position in column units
  toAnchor: number;           // Target position in column units
  fromActorId: string;        // Resolved source actor
  toActorId: string;          // Resolved target actor
  direction: 1 | -1;          // 1 = left-to-right, -1 = right-to-left
};
```

## Advanced: Custom Layouts

For complete control over rendering, use the core layout APIs:

```tsx
import {
  computeLayout,
  anchorToPixels,
  anchorToPercent,
  COLUMN_WIDTH,
} from "seqdia";

// Compute layout from model
const layout = computeLayout(model, {
  expandedActorIds: new Set(["backend"]),
  headerRowHeight: 56,
  messageRowHeight: 76,
});

// Convert anchor positions to pixels or percentages
const fromX = anchorToPixels(resolved.fromAnchor, COLUMN_WIDTH);
const toX = anchorToPixels(resolved.toAnchor, COLUMN_WIDTH);

// Or use percentages for responsive layouts
const fromPercent = anchorToPercent(resolved.fromAnchor, layout.leafCount);
const toPercent = anchorToPercent(resolved.toAnchor, layout.leafCount);
```

### SequenceLayout

The layout object contains all positioning data:

```tsx
type SequenceLayout = {
  headerRows: VisibleActor[][];           // Actors grouped by depth
  visibleActors: VisibleActor[];          // All visible actors
  visibleActorMap: Record<string, VisibleActor>;
  leafCount: number;                      // Number of leaf columns
  anchors: Record<string, number>;        // Actor ID → anchor position
  spans: Record<string, { start: number; end: number }>;
  messages: PositionedMessage[];          // Messages with row positions
  headerHeight: number;
  messageAreaHeight: number;
  totalHeight: number;
  rowHeight: number;
  headerRowHeight: number;
};
```

## Advanced: Component Parts

Build custom diagrams using individual components:

```tsx
import {
  SequenceProvider,
  SequenceSurface,
  SequenceSurfaceRoot,
  SequenceCanvasSection,
  HeaderGrid,
  RegionsLayer,
  RailsLayer,
  MessagesLayer,
  MessageArrow,
  MessageLabel,
} from "seqdia";

// Use SequenceSurface with a children render prop for full control
<SequenceSurface
  model={model}
  controller={controller}
>
  {({ layout, resolvedMessages, activeActors, columnWidth, interactions }) => (
    <>
      <HeaderGrid layout={layout} /* ... */ />
      <RegionsLayer layout={layout} /* ... */ />
      <RailsLayer layout={layout} activeActors={activeActors} /* ... */ />
      <MessagesLayer resolvedMessages={resolvedMessages} /* ... */ />
    </>
  )}
</SequenceSurface>
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
<!-- npm badge -->
