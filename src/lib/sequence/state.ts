export type HighlightState = {
  sequences: Set<string>;
  actors: Set<string>;
  messages: Set<string>;
  messageClasses: Set<string>;
};

export const defaultHighlightState = (): HighlightState => ({
  sequences: new Set<string>(),
  actors: new Set<string>(),
  messages: new Set<string>(),
  messageClasses: new Set<string>(),
});

export type StyleRegistry = {
  sequences: Record<string, string | undefined>;
  actors: Record<string, string | undefined>;
  messages: Record<string, string | undefined>;
  messageClasses: Record<string, string | undefined>;
};

export const defaultStyleRegistry = (): StyleRegistry => ({
  sequences: {},
  actors: {},
  messages: {},
  messageClasses: {},
});
