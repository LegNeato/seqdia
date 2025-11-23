export type HighlightState = {
  actors: Set<string>;
  messages: Set<string>;
};

export type SelectionState = {
  actors: Set<string>;
  messages: Set<string>;
};

export const defaultHighlightState = (): HighlightState => ({
  actors: new Set<string>(),
  messages: new Set<string>(),
});

export const defaultSelectionState = (): SelectionState => ({
  actors: new Set<string>(),
  messages: new Set<string>(),
});
