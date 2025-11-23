import { useMemo, useState } from "react";
import {
  defaultHighlightState,
  defaultStyleRegistry,
  type HighlightState,
  type StyleRegistry,
} from "@/lib/sequence/state";
import { type Sequence } from "@/lib/sequence/types";

export type SequenceControllerApi = {
  highlightActor: (actorId: string | string[]) => void;
  highlightMessage: (messageId: string | string[]) => void;
  highlightMessageClass: (messageClass: string | string[]) => void;
  highlightSequence: (sequenceId: string | string[]) => void;
  clearHighlights: () => void;
  setActorStyle: (actorId: string, className: string) => void;
  setMessageStyle: (messageId: string, className: string) => void;
  setMessageClassStyle: (messageClass: string, className: string) => void;
  setSequenceStyle: (sequenceId: string, className: string) => void;
  toggleActor: (actorId: string) => void;
  collapseActor: (actorId: string) => void;
  expandActor: (actorId: string) => void;
};

export type SequenceControllerState = {
  highlight: HighlightState;
  styles: StyleRegistry;
  collapsedActors: Set<string>;
};

export type SequenceController = {
  sequence: Sequence;
  state: SequenceControllerState;
  api: SequenceControllerApi;
};

function ensureArray(value: string | string[]) {
  return Array.isArray(value) ? value : [value];
}

export function useSequenceController(sequence: Sequence): SequenceController {
  const [highlight, setHighlight] = useState<HighlightState>(
    defaultHighlightState,
  );
  const [styles, setStyles] = useState<StyleRegistry>(defaultStyleRegistry);
  const [collapsedActors, setCollapsedActors] = useState<Set<string>>(
    () =>
      new Set(
        sequence.actors
          .filter((actor) => actor.defaultCollapsed)
          .map((actor) => actor.id),
      ),
  );

  const api: SequenceControllerApi = useMemo(
    () => ({
      highlightActor: (actorId) => {
        const ids = ensureArray(actorId);
        setHighlight((prev) => ({
          ...prev,
          actors: new Set(ids),
        }));
      },
      highlightMessage: (messageId) => {
        const ids = ensureArray(messageId);
        setHighlight((prev) => ({
          ...prev,
          messages: new Set(ids),
        }));
      },
      highlightMessageClass: (messageClass) => {
        const classes = ensureArray(messageClass);
        setHighlight((prev) => ({
          ...prev,
          messageClasses: new Set(classes),
        }));
      },
      highlightSequence: (sequenceId) => {
        const ids = ensureArray(sequenceId);
        setHighlight((prev) => ({
          ...prev,
          sequences: new Set(ids),
        }));
      },
      clearHighlights: () => setHighlight(defaultHighlightState),
      setActorStyle: (actorId, className) =>
        setStyles((prev) => ({
          ...prev,
          actors: { ...prev.actors, [actorId]: className },
        })),
      setMessageStyle: (messageId, className) =>
        setStyles((prev) => ({
          ...prev,
          messages: { ...prev.messages, [messageId]: className },
        })),
      setMessageClassStyle: (messageClass, className) =>
        setStyles((prev) => ({
          ...prev,
          messageClasses: { ...prev.messageClasses, [messageClass]: className },
        })),
      setSequenceStyle: (sequenceId, className) =>
        setStyles((prev) => ({
          ...prev,
          sequences: { ...prev.sequences, [sequenceId]: className },
        })),
      toggleActor: (actorId) =>
        setCollapsedActors((prev) => {
          const next = new Set(prev);
          if (next.has(actorId)) {
            next.delete(actorId);
          } else {
            next.add(actorId);
          }
          return next;
        }),
      collapseActor: (actorId) =>
        setCollapsedActors((prev) => {
          const next = new Set(prev);
          next.add(actorId);
          return next;
        }),
      expandActor: (actorId) =>
        setCollapsedActors((prev) => {
          const next = new Set(prev);
          next.delete(actorId);
          return next;
        }),
    }),
    [],
  );

  const state = useMemo(
    () => ({ highlight, styles, collapsedActors }),
    [collapsedActors, highlight, styles],
  );

  return { sequence, state, api };
}
