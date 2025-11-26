import { useMemo, useState } from "react";
import {
  defaultHighlightState,
  defaultSelectionState,
  type HighlightState,
  type SelectionState,
} from "../lib/sequence/state";
import { type ActorNode, type SequenceDiagramModel } from "../lib/sequence/types";

export type SequenceControllerApi = {
  highlightActors: (actorId: string | string[]) => void;
  highlightMessages: (messageId: string | string[]) => void;
  clearHighlights: () => void;
  selectActors: (actorId: string | string[]) => void;
  selectMessages: (messageId: string | string[]) => void;
  toggleActorSelection: (actorId: string) => void;
  toggleMessageSelection: (messageId: string) => void;
  clearSelection: () => void;
  toggleActorExpansion: (actorId: string) => void;
  collapseActor: (actorId: string) => void;
  expandActor: (actorId: string) => void;
  setExpandedActors: (actorIds: Set<string>) => void;
};

export type SequenceControllerState = {
  highlight: HighlightState;
  selection: SelectionState;
  expandedActors: Set<string>;
};

export type SequenceController = {
  model: SequenceDiagramModel;
  state: SequenceControllerState;
  highlightActors: SequenceControllerApi["highlightActors"];
  highlightMessages: SequenceControllerApi["highlightMessages"];
  clearHighlights: SequenceControllerApi["clearHighlights"];
  selectActors: SequenceControllerApi["selectActors"];
  selectMessages: SequenceControllerApi["selectMessages"];
  toggleActorSelection: SequenceControllerApi["toggleActorSelection"];
  toggleMessageSelection: SequenceControllerApi["toggleMessageSelection"];
  clearSelection: SequenceControllerApi["clearSelection"];
  toggleActorExpansion: SequenceControllerApi["toggleActorExpansion"];
  collapseActor: SequenceControllerApi["collapseActor"];
  expandActor: SequenceControllerApi["expandActor"];
  setExpandedActors: SequenceControllerApi["setExpandedActors"];
};

function ensureArray(value: string | string[]) {
  return Array.isArray(value) ? value : [value];
}

function deriveDefaultExpandedActors(actors: readonly ActorNode[]): Set<string> {
  const expanded = new Set<string>();
  const walk = (nodes: readonly ActorNode[]) => {
    nodes.forEach((node) => {
      const hasChildren = node.children && node.children.length > 0;
      if (hasChildren && (node.defaultExpanded ?? true)) {
        expanded.add(node.actorId);
      }
      if (node.children) {
        walk(node.children);
      }
    });
  };
  walk(actors);
  return expanded;
}

export function useSequenceController(
  model: SequenceDiagramModel,
): SequenceController {
  const [highlight, setHighlight] = useState<HighlightState>(
    defaultHighlightState,
  );
  const [selection, setSelection] = useState<SelectionState>(
    defaultSelectionState,
  );
  const [expandedActors, setExpandedActors] = useState<Set<string>>(() =>
    deriveDefaultExpandedActors(model.actors),
  );

  const api: SequenceControllerApi = useMemo(
    () => ({
      highlightActors: (actorId) => {
        const ids = ensureArray(actorId);
        setHighlight((prev) => ({
          ...prev,
          actors: new Set(ids),
        }));
      },
      highlightMessages: (messageId) => {
        const ids = ensureArray(messageId);
        setHighlight((prev) => ({
          ...prev,
          messages: new Set(ids),
        }));
      },
      clearHighlights: () => setHighlight(defaultHighlightState()),
      selectActors: (actorId) => {
        const ids = ensureArray(actorId);
        setSelection((prev) => ({
          ...prev,
          actors: new Set(ids),
        }));
      },
      selectMessages: (messageId) => {
        const ids = ensureArray(messageId);
        setSelection((prev) => ({
          ...prev,
          messages: new Set(ids),
        }));
      },
      toggleActorSelection: (actorId) =>
        setSelection((prev) => {
          const next = new Set(prev.actors);
          if (next.has(actorId)) {
            next.delete(actorId);
          } else {
            next.add(actorId);
          }
          return { ...prev, actors: next };
        }),
      toggleMessageSelection: (messageId) =>
        setSelection((prev) => {
          const next = new Set(prev.messages);
          if (next.has(messageId)) {
            next.delete(messageId);
          } else {
            next.add(messageId);
          }
          return { ...prev, messages: next };
        }),
      clearSelection: () => setSelection(defaultSelectionState()),
      toggleActorExpansion: (actorId) =>
        setExpandedActors((prev) => {
          const next = new Set(prev);
          if (next.has(actorId)) {
            next.delete(actorId);
          } else {
            next.add(actorId);
          }
          return next;
        }),
      collapseActor: (actorId) =>
        setExpandedActors((prev) => {
          const next = new Set(prev);
          next.delete(actorId);
          return next;
        }),
      expandActor: (actorId) =>
        setExpandedActors((prev) => {
          const next = new Set(prev);
          next.add(actorId);
          return next;
        }),
      setExpandedActors: (actorIds) => setExpandedActors(new Set(actorIds)),
    }),
    [],
  );

  const state = useMemo(
    () => ({ highlight, selection, expandedActors }),
    [expandedActors, highlight, selection],
  );

  return { model, state, ...api };
}
