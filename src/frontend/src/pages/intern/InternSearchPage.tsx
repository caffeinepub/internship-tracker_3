import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "../../backend";
import { useActor } from "../../hooks/useActor";

function useProjectSearch(debounceMs = 300) {
  const { actor } = useActor();
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<View[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (term: string) => {
      if (!actor || !term.trim()) {
        setProjects([]);
        return;
      }
      setLoading(true);
      try {
        const results = await actor.searchProjects(term);
        setProjects(results);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    },
    [actor],
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setProjects([]);
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
    setProjects([]);
  }, []);

  return { query, setQuery, projects, loading, clearSearch };
}

function ProjectResultCard({ project, idx }: { project: View; idx: number }) {
  return (
    <Card
      className="hover:border-accent/40 transition-colors group"
      data-ocid={`intern-search.project.${idx + 1}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
              {project.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {project.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                  {project.description}
                </p>
              )}
              {project.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0 rounded-full bg-accent/10 text-accent border border-accent/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Badge
            variant={
              project.status === "active"
                ? "default"
                : project.status === "completed"
                  ? "secondary"
                  : "outline"
            }
            className="text-[10px] px-1.5 py-0 flex-shrink-0 capitalize"
          >
            {project.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InternSearchPage() {
  const { query, setQuery, projects, loading, clearSearch } =
    useProjectSearch();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find projects by name or description
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search projects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-11 text-sm"
          autoFocus
          data-ocid="intern-search.input"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="intern-search.clear_button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && !query && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Search className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm font-medium">Start typing to search</p>
          <p className="text-xs mt-1 opacity-70">
            Search across your assigned projects
          </p>
        </div>
      )}

      {!loading && query && projects.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search term
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && projects.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <FolderKanban className="h-3.5 w-3.5" />
            Projects &mdash; {projects.length} result
            {projects.length !== 1 ? "s" : ""}
          </h2>
          <div className="space-y-2">
            {projects.map((project, idx) => (
              <ProjectResultCard
                key={String(project.id)}
                project={project}
                idx={idx}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
