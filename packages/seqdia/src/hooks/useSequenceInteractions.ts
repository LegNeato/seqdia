import { useEffect } from "react";
import type { HTMLAttributes } from "react";

import { useSequenceContext } from "../components/sequence/SequenceProvider";
import {
  type SequenceController,
  type SequenceControllerState,
} from "./useSequenceController";
import { type HighlightState, type SelectionState } from "../lib/sequence/state";

export type SequenceInteractionOptions = {
  /**
   * When true (default), clicking an actor toggles it in the selection set.
   */
  selectActorsOnClick?: boolean;
  /**
   * When true (default), clicking a message toggles it in the selection set.
   */
  selectMessagesOnClick?: boolean;
  /**
   * When false, actor clicks replace the selection instead of toggling.
   */
  toggleActorSelection?: boolean;
  /**
   * When false, message clicks replace the selection instead of toggling.
   */
  toggleMessageSelection?: boolean;
  /**
   * Optional automatic hover highlighting for actors.
   */
  highlightActorsOnHover?: boolean;
  /**
   * Optional automatic hover highlighting for messages.
   */
  highlightMessagesOnHover?: boolean;
  onSelectionChange?: (selection: SelectionState) => void;
  onHighlightChange?: (highlight: HighlightState) => void;
  onActorClick?: (actorId: string) => void;
  onActorHoverChange?: (actorId: string | null, state: SequenceControllerState) => void;
  onMessageClick?: (messageId: string) => void;
  onMessageHoverChange?: (messageId: string | null, state: SequenceControllerState) => void;
};

export type SequenceActorInteractions<T extends HTMLElement = HTMLElement> = {
  highlighted: boolean;
  selected: boolean;
  props: HTMLAttributes<T> & {
    "data-actor-id": string;
    "data-highlighted"?: "true";
    "data-selected"?: "true";
  };
};

export type SequenceMessageInteractions<T extends HTMLElement = HTMLElement> = {
  highlighted: boolean;
  selected: boolean;
  props: HTMLAttributes<T> & {
    "data-message-id": string;
    "data-highlighted"?: "true";
    "data-selected"?: "true";
  };
};

export type SequenceInteractions = {
  controller: SequenceController;
  getActorInteractions: <T extends HTMLElement = HTMLElement>(
    actorId: string,
  ) => SequenceActorInteractions<T>;
  getMessageInteractions: <T extends HTMLElement = HTMLElement>(
    messageId: string,
  ) => SequenceMessageInteractions<T>;
};

export function useSequenceInteractions(
  options: SequenceInteractionOptions = {},
): SequenceInteractions {
  const { controller } = useSequenceContext();
  const { onSelectionChange, onHighlightChange } = options;

  const {
    selectActorsOnClick = true,
    selectMessagesOnClick = true,
    toggleActorSelection = true,
    toggleMessageSelection = true,
    highlightActorsOnHover = false,
    highlightMessagesOnHover = false,
  } = options;

  useEffect(() => {
    onSelectionChange?.(controller.state.selection);
  }, [controller.state.selection, onSelectionChange]);

  useEffect(() => {
    onHighlightChange?.(controller.state.highlight);
  }, [controller.state.highlight, onHighlightChange]);

  const getActorInteractions = <T extends HTMLElement = HTMLElement>(
    actorId: string,
  ): SequenceActorInteractions<T> => {
    const highlighted = controller.state.highlight.actors.has(actorId);
    const selected = controller.state.selection.actors.has(actorId);

    return {
      highlighted,
      selected,
      props: {
        "data-actor-id": actorId,
        "data-highlighted": highlighted ? "true" : undefined,
        "data-selected": selected ? "true" : undefined,
        onClick: () => {
          if (selectActorsOnClick) {
            if (toggleActorSelection) {
              controller.toggleActorSelection(actorId);
            } else {
              controller.selectActors(actorId);
            }
          }
          options.onActorClick?.(actorId);
        },
        onMouseEnter: () => {
          if (highlightActorsOnHover) {
            controller.highlightActors(actorId);
          }
          options.onActorHoverChange?.(actorId, controller.state);
        },
        onMouseLeave: () => {
          if (highlightActorsOnHover) {
            controller.clearHighlights();
          }
          options.onActorHoverChange?.(null, controller.state);
        },
      },
    };
  };

  const getMessageInteractions = <T extends HTMLElement = HTMLElement>(
    messageId: string,
  ): SequenceMessageInteractions<T> => {
    const highlighted = controller.state.highlight.messages.has(messageId);
    const selected = controller.state.selection.messages.has(messageId);

    return {
      highlighted,
      selected,
      props: {
        "data-message-id": messageId,
        "data-highlighted": highlighted ? "true" : undefined,
        "data-selected": selected ? "true" : undefined,
        onClick: () => {
          if (selectMessagesOnClick) {
            if (toggleMessageSelection) {
              controller.toggleMessageSelection(messageId);
            } else {
              controller.selectMessages(messageId);
            }
          }
          options.onMessageClick?.(messageId);
        },
        onMouseEnter: () => {
          if (highlightMessagesOnHover) {
            controller.highlightMessages(messageId);
          }
          options.onMessageHoverChange?.(messageId, controller.state);
        },
        onMouseLeave: () => {
          if (highlightMessagesOnHover) {
            controller.clearHighlights();
          }
          options.onMessageHoverChange?.(null, controller.state);
        },
      },
    };
  };

  return {
    controller,
    getActorInteractions,
    getMessageInteractions,
  };
}
