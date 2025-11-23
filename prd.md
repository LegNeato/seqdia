# React Sequence Diagram Architecture  
## PRD / Design Doc (Tree Labels, Arbitrary Nesting)

## 0. Scope and Assumptions

This PRD defines a React + TypeScript architecture for interactive sequence diagrams with:

- Tree-structured actor labels with arbitrary depth  
- Expandable and collapsible nodes at any depth  
- Vertical actor lines and nested regions  
- Messages stacked in rows  
- Highlighting and selection  
- Grid / tree based layout  
- Pure React components (no SVG) for lines/regions/messages  
- Linear message sequences: each message must start where the previous one ended  

Assumptions:

- Labels form a rooted tree. Depth is unbounded.  
- Any node can be expanded or collapsed.  
- Any node can be a message endpoint.  
- Messages always have unique row indices.  
- Highlight and selection state is externally owned.

---

## 1. High Level Layout

Two vertical sections:

1. **Header section**  
   - Multi-row tree of labels

2. **Diagram section**  
   - Vertical lines and nested regions  
   - Horizontal messages  
   - Highlight / selection overlays  

Columns are derived from **visible leaf nodes**.  
Rows:

- Header rows: depth 0..maxVisibleDepth  
- Message rows: dynamic below  

Expansion changes tree shape and can increase the number of visible leaf columns, widening the diagram.

---

## 2. Data Model

### 2.1 Actor Nodes

Each node is an “actor”:

- `actorId`  
- `parentActorId | null`  
- `children: actorId[]`  
- Optional label component  
- Alignment: `left | center | right`  
- Optional style hints  

Nodes can be at any depth.

### 2.2 Expansion State

- Boolean per node.  
- A node’s children appear only when expanded.  
- Collapsing a node hides its entire subtree.  
- Messages for hidden nodes are not shown.

### 2.3 Messages

Each message:

- `messageId`  
- `fromActorId`  
- `toActorId`  
- Optional UI payload  

Rules:

- Messages visible only if both endpoints and all ancestors are visible.  
- One message per vertical row index.  
- Messages sorted by input order unless a `rowIndex` is provided.

---

## 3. Header Section (Tree of Labels)

### 3.1 Tree Rendering

Header row per tree depth:

- Row 0: visible root nodes  
- Row 1: visible children of expanded row-0 nodes  
- Row 2: children of expanded row-1 nodes  
- And so on  

Horizontal order: in-order traversal of visible nodes.

### 3.2 Column Spans

Every visible node occupies a span defined by the number of its visible leaf descendants:

- A leaf occupies 1 column.  
- A non-leaf occupies `sum(visible leaf columns of children)`.

Node anchor for its vertical line:

- `left`: column start  
- `center`: midpoint of span  
- `right`: column end  

### 3.3 Expansion Effects

When a node expands:

- Children appear on the next depth row.  
- Leaves increase → more columns → diagram widens.  
- All anchors are recomputed based on new spans.

When a node collapses:

- Entire subtree disappears.  
- Diagram may shrink.  
- Some siblings may shift horizontally.

---

## 4. Diagram Section (Lines and Regions)

### 4.1 Column Anchors

From header layout compute:

- For each visible leaf node: a single x coordinate.  
- For each internal node: `xMin`, `xMax`.  
- For every node: anchor x from alignment.

### 4.2 Lines and Nested Regions

**Collapsed node:**  
- One vertical line at its anchor.

**Expanded internal node:**  
- A region:  
  - Start line at `xMin`  
  - End line at `xMax`  
  - Background fill between them (optional)  

**Nested nodes:**  
- Regions can nest to arbitrary depth.  
- Each deeper region lives visually inside its parent region.  
- Leaf lines render inside the innermost region they belong to.

Z-order for regions:

- Shallow regions behind deeper regions.  
- All lines drawn above backgrounds.

Collapse removes:

- Region start/end lines  
- All descendant lines  
- Background  
- Descendant visibility

---

## 5. Messages

### 5.1 Positioning

Each message:

- Occupies a dedicated row  
- Drawn with start at anchor(fromActorId)  
- Drawn with end at anchor(toActorId)  

### 5.2 Visibility Rules

A message is shown only if:

- `fromActorId` is visible  
- `toActorId` is visible  
- All ancestors of both nodes are expanded  

Otherwise hidden. Hidden messages do not reserve vertical space; rows compact and reflow when nodes collapse or expand.

### 5.3 Z-Order

Render sequence:

1. Region backgrounds  
2. Region boundary lines and leaf lines  
3. Messages  
4. Highlight overlays  
5. Selection hit targets  

Messages always draw above actor lines.

---

## 6. Grid and Rendering Strategy

### 6.1 Header Layout

Use **CSS grid**:

- One column per visible leaf  
- Parent spans multiple columns  
- Children subdivide the parent span  

Compute:

- `leafIndex -> x`  
- `actorId -> [leafStart, leafEnd]`  
- `actorId -> anchorX`

### 6.2 Diagram Rendering

Use layered **React components** (no SVG):

- Regions: absolutely positioned `<div>` spans with background fills  
- Vertical lines: thin `<div>` rails anchored to leaf columns  
- Messages: absolute `<div>` rows with a start dot, horizontal bar, and CSS triangle arrowhead  
- Z-order: regions behind lines; messages above lines; highlights/selection via class toggles  

Coordinates derived from anchors (converted to px via column width) and row heights.

---

## 7. Highlighting

Highlightable:

- Nodes at any depth  
- Messages  

Props:

- `highlightedActorIds`  
- `highlightedMessageIds`  

Effects:

- Style modifiers  
- Optional tinted backgrounds for nodes  
- Optional emphasized messages  

Highlighting never changes layout.

---

## 8. Selection

Selection is external.

Props:

- `selectedActorIds`  
- `selectedMessageIds`

Callbacks:

- `onActorClick(actorId)`  
- `onMessageClick(messageId)`  
- Optional `onSelectionChange({ actorIds, messageIds })`

Hit zones:

- Invisible label rectangles  
- Thin line hit strips  
- Message hit rectangles  

Supports multi-select, single-select, and clear.

---

## 9. Performance

Recompute layout when:

- Tree changes  
- Expansion state changes  
- Messages change  

Do not recompute layout when:

- Highlight changes  
- Selection changes  

For large diagrams:

- Message rows can be virtualized  
- Tree layout remains global

---

## 10. Risks and Clarifications

- **Nested regions:**  
  Regions may be arbitrarily deep and must nest cleanly.

- **Column stability:**  
  Horizontal positions are not stable across expansion. All anchors recompute.

- **Message visibility:**  
  A message is visible only if both endpoints and their entire ancestor chain are visible.

- **Leaf count drives width:**  
  Any new visible leaf creates a new column. Diagram grows horizontally with visibility.

---

This PRD is unambiguous and ready for implementation.
