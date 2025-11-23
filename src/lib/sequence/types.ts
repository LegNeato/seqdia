export type MessageKind = "sync" | "async" | "return" | "note";

export type MessageClass =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral"
  | string;

export interface SequenceMessage {
  id: string;
  from: string;
  to: string;
  label: string;
  /**
   * Optional identifier of the source message when the diagram expands nested sequences.
   */
  originId?: string;
  /**
   * Parent actor id if this message was lifted from an embedded sequence.
   */
  parentId?: string;
  description?: string;
  messageClass?: MessageClass;
  kind?: MessageKind;
  className?: string;
  meta?: Record<string, string | number>;
}

export interface SequenceActor {
  id: string;
  label: string;
  /**
   * Optional identifier of the source actor when the diagram expands nested sequences.
   */
  originId?: string;
  /**
   * Parent actor id if this actor originated from an embedded sequence.
   */
  parentId?: string;
  subtitle?: string;
  className?: string;
  laneClassName?: string;
  embeddedSequence?: Sequence;
  defaultCollapsed?: boolean;
}

export interface Sequence {
  id: string;
  label?: string;
  description?: string;
  actors: SequenceActor[];
  messages: SequenceMessage[];
  className?: string;
}
