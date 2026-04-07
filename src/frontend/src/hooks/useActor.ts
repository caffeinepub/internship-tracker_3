import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";

export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  return _useActor(createActor) as {
    actor: backendInterface | null;
    isFetching: boolean;
  };
}
