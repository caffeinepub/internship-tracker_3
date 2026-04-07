import { useCallback, useEffect, useRef, useState } from "react";
import type { View, View__2 } from "../backend";
import { useActor } from "./useActor";

interface SearchResults {
  interns: View__2[];
  projects: View[];
}

export function useSearch(debounceMs = 300) {
  const { actor } = useActor();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    interns: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (term: string) => {
      if (!actor || !term.trim()) {
        setResults({ interns: [], projects: [] });
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [interns, projects] = await Promise.all([
          actor.searchInterns(term),
          actor.searchProjects(term),
        ]);
        setResults({ interns, projects });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults({ interns: [], projects: [] });
      } finally {
        setLoading(false);
      }
    },
    [actor],
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults({ interns: [], projects: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => {
      doSearch(query);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, doSearch, debounceMs]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults({ interns: [], projects: [] });
    setError(null);
  }, []);

  return { query, setQuery, results, loading, error, clearSearch };
}
