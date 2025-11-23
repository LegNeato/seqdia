import { createContext, useContext, type ReactNode } from "react";
import {
  useSequenceController,
  type SequenceController,
} from "@/hooks/useSequenceController";
import { type Sequence } from "@/lib/sequence/types";

type SequenceContextValue = {
  sequence: Sequence;
  controller: SequenceController;
};

const SequenceContext = createContext<SequenceContextValue | null>(null);

type SequenceProviderProps = {
  sequence: Sequence;
  controller?: SequenceController;
  children: ReactNode;
};

export function SequenceProvider({
  sequence,
  controller,
  children,
}: SequenceProviderProps) {
  const internal = useSequenceController(sequence);
  const value: SequenceContextValue = {
    sequence,
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
