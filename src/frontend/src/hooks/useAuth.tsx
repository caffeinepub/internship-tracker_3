import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserRole, View__1 } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type AppRole =
  | "loading"
  | "guest"
  | "no-profile"
  | "pending"
  | "rejected"
  | "active"
  | "admin";

interface AuthState {
  appRole: AppRole;
  profile: View__1 | null;
  userRole: UserRole | null;
  refresh: () => void;
}

const AuthContext = createContext<AuthState>({
  appRole: "loading",
  profile: null,
  userRole: null,
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const [appRole, setAppRole] = useState<AppRole>("loading");
  const [profile, setProfile] = useState<View__1 | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // A counter used as a manual trigger to re-run the auth effect
  const [refreshSignal, setRefreshSignal] = useState(0);

  const refresh = useCallback(() => setRefreshSignal((n) => n + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshSignal is an intentional manual trigger
  useEffect(() => {
    if (isInitializing || isFetching) {
      setAppRole("loading");
      return;
    }

    if (!identity) {
      setAppRole("guest");
      setProfile(null);
      setUserRole(null);
      return;
    }

    if (!actor) {
      setAppRole("loading");
      return;
    }

    let cancelled = false;
    (async () => {
      setAppRole("loading");
      try {
        const [adminResult, roleResult, profileResult] = await Promise.all([
          actor.isCallerAdmin(),
          actor.getCallerUserRole(),
          actor.getCallerUserProfile(),
        ]);

        if (cancelled) return;

        const prof = profileResult ?? null;
        setProfile(prof);
        setUserRole(roleResult as UserRole);

        if (adminResult) {
          setAppRole("admin");
        } else if (!prof) {
          setAppRole("no-profile");
        } else if (prof.registrationStatus === "pending") {
          setAppRole("pending");
        } else if (prof.registrationStatus === "rejected") {
          setAppRole("rejected");
        } else if (prof.registrationStatus === "active") {
          setAppRole("active");
        } else {
          setAppRole("no-profile");
        }
      } catch {
        if (!cancelled) setAppRole("guest");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [identity, actor, isFetching, isInitializing, refreshSignal]);

  return (
    <AuthContext.Provider value={{ appRole, profile, userRole, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
