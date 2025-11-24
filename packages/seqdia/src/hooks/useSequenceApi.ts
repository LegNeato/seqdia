import { useEffect, useRef } from "react";
import { useSequenceContext } from "../components/sequence/SequenceProvider";
import { type SequenceController } from "./useSequenceController";

export function useSequenceApi(
  onReady?: (controller: SequenceController) => void,
) {
  const { controller } = useSequenceContext();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasFired.current && onReady) {
      onReady(controller);
      hasFired.current = true;
    }
  }, [controller, onReady]);

  return controller;
}
