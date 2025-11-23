import { useEffect, useRef } from "react";
import { useSequenceContext } from "@/components/sequence/SequenceProvider";
import { type SequenceControllerApi } from "./useSequenceController";

export function useSequenceApi(onReady?: (api: SequenceControllerApi) => void) {
  const { controller } = useSequenceContext();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasFired.current && onReady) {
      onReady(controller.api);
      hasFired.current = true;
    }
  }, [controller.api, onReady]);

  return controller.api;
}
