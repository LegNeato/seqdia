// =============================================================================
// CORE: Pure data model, layout computation, and hooks (no display components)
// =============================================================================

// Layout computation - the heart of the library
export { computeLayout } from "./lib/sequence/layout";
export type { SequenceLayout, VisibleActor, PositionedMessage } from "./lib/sequence/layout";

// Types for defining sequence diagrams
export * from "./lib/sequence/types";

// Visibility helpers
export * from "./lib/sequence/visible";

// React hooks for state management
export { useSequenceController } from "./hooks/useSequenceController";
export type { SequenceController } from "./hooks/useSequenceController";

export { useSequenceLayout, type ResolvedMessage, type LayoutData } from "./hooks/useSequenceLayout";

export {
  useSequenceInteractions,
  type SequenceInteractionOptions,
  type SequenceActorInteractions,
  type SequenceMessageInteractions,
  type SequenceInteractions,
} from "./hooks/useSequenceInteractions";

export { useSequenceApi } from "./hooks/useSequenceApi";

// Utility functions for unit conversion
export { anchorToPixels, anchorToPercent, collectActorIds } from "./lib/utils";

// Constants (consumers can use these or define their own)
export { COLUMN_WIDTH } from "./lib/constants";

// =============================================================================
// COMPONENTS: Optional reference implementations (opinionated, styled)
// These are provided as convenience - consumers can use their own components
// =============================================================================

// Main diagram component with default styling
export {
  SequenceDiagram,
  SequenceSurface,
  SequenceSurfaceRoot,
  SequenceCanvasSection,
  type SequenceDiagramProps,
  type SequenceSurfaceProps,
  type SequenceSurfaceRenderContext,
  type SequenceSurfaceRootProps,
  type SequenceCanvasSectionProps,
  type ActorRenderProps,
  type MessageRenderProps,
  type ActorStyle,
  type MessageStyle,
} from "./components/sequence/SequenceDiagram";

// Individual layer components (can be used as reference or extended)
export {
  HeaderGrid,
  RegionsLayer,
  RailsLayer,
  MessagesLayer,
  MessageArrow,
  type MessageArrowProps,
  MessageLabel,
  type MessageLabelProps,
} from "./components/sequence/SequenceDiagram";

// Provider for nested component access
export { SequenceProvider } from "./components/sequence/SequenceProvider";

// Utility functions used by components (optional for consumers)
export { cn, softColor } from "./lib/utils";
