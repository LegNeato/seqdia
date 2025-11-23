export type ActorAlignment = "left" | "center" | "right";

export type ActorNode = {
  actorId: string;
  label: string;
  parentActorId?: string | null;
  children?: readonly ActorNode[];
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
  actors: readonly ActorNode[];
  messages: readonly SequenceMessage[];
  className?: string;
};

export type LinearMessages<
  Ms extends readonly SequenceMessage[],
  PrevTo extends string | null = null,
> = Ms extends readonly [infer First, ...infer Rest]
  ? First extends SequenceMessage
    ? PrevTo extends null
      ? [First, ...LinearMessages<Rest extends readonly SequenceMessage[] ? Rest : [], First["toActorId"]>]
      : First["fromActorId"] extends PrevTo
        ? [First, ...LinearMessages<Rest extends readonly SequenceMessage[] ? Rest : [], First["toActorId"]>]
        : never
    : never
  : Ms;

export function defineLinearDiagram<
  M extends SequenceDiagramModel & { messages: readonly SequenceMessage[] },
>(model: M & { messages: LinearMessages<M["messages"]> }): M {
  return model;
}
