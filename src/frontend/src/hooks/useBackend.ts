import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { UserRole, View, View__1 } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useBackend() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(
    async <T>(
      fn: () => Promise<T>,
      errorMsg = "An error occurred",
    ): Promise<T | null> => {
      setLoading(true);
      try {
        const result = await fn();
        return result;
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : errorMsg;
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getCallerRole = useCallback(async (): Promise<UserRole | null> => {
    if (!actor) return null;
    return withLoading(() => actor.getCallerUserRole());
  }, [actor, withLoading]);

  const getCallerProfile = useCallback(async (): Promise<View__1 | null> => {
    if (!actor) return null;
    const result = await withLoading(() => actor.getCallerUserProfile());
    return result ?? null;
  }, [actor, withLoading]);

  const isAdmin = useCallback(async (): Promise<boolean> => {
    if (!actor) return false;
    const result = await withLoading(() => actor.isCallerAdmin());
    return result ?? false;
  }, [actor, withLoading]);

  return {
    actor,
    identity,
    loading,
    withLoading,
    getCallerRole,
    getCallerProfile,
    isAdmin,
  };
}
