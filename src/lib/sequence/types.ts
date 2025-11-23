export type ActorAlignment = "left" | "center" | "right";

export type ActorNode = {
  actorId: string;
  label: string;
  parentActorId?: string | null;
  children?: ActorNode[];
  alignment?: ActorAlignment;
  /**
   * Optional style hints for label/line/region rendering.
   */
  className?: string;
  regionClassName?: string;
  /**
   * Whether the node should start expanded. Defaults to true when children are present.
   */
  defaultExpanded?: boolean;
};

export type SequenceMessage = {
  messageId: string;
  fromActorId: string;
  toActorId: string;
  label: string;
  /**
   * Explicit vertical row index. Unique per message.
   */
  rowIndex?: number;
  className?: string;
  /**
   * Arbitrary payload for renderers (metadata, badges, etc.).
   */
  payload?: Record<string, unknown>;
};

export type SequenceDiagramModel = {
  id?: string;
  title?: string;
  description?: string;
  actors: ActorNode[];
  messages: SequenceMessage[];
  className?: string;
};
