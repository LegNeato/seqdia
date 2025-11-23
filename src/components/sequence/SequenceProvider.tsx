import { createContext, useContext, type ReactNode } from "react";
import {
  useSequenceController,
  type SequenceController,
} from "@/hooks/useSequenceController";
import { type SequenceDiagramModel } from "@/lib/sequence/types";

type SequenceContextValue = {
  model: SequenceDiagramModel;
  controller: SequenceController;
};

const SequenceContext = createContext<SequenceContextValue | null>(null);

type SequenceProviderProps = {
  model: SequenceDiagramModel;
  controller?: SequenceController;
  children: ReactNode;
};

export function SequenceProvider({
  model,
  controller,
  children,
}: SequenceProviderProps) {
  const internal = useSequenceController(model);
  const value: SequenceContextValue = {
    model,
    controller: controller ?? internal,
  };

  return (
    <SequenceContext.Provider value={value}>
      {children}
    </SequenceContext.Provider>
  );
}

export function useSequenceContext() {
  const context = useContext(SequenceContext);
  if (!context) {
    throw new Error("useSequenceContext must be used within SequenceProvider");
  }
  return context;
}
