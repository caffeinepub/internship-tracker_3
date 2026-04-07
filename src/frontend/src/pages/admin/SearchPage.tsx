import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Search, Users, X } from "lucide-react";
import type { View, View__2 } from "../../backend";
import { useSearch } from "../../hooks/useSearch";

function InternResultCard({ intern, idx }: { intern: View__2; idx: number }) {
  const initials =
    intern.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <Card
      className="hover:border-primary/40 transition-colors group"
      data-ocid={`search.intern.${idx + 1}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            {intern.photoUrl ? (
              <img
                src={intern.photoUrl}
                alt={intern.name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {intern.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {intern.email}
            </p>
          </div>
          <Badge
            variant={
              intern.registrationStatus === "active"
                ? "default"
                : intern.registrationStatus === "pending"
                  ? "secondary"
                  : "destructive"
            }
            className="text-[10px] px-1.5 py-0 flex-shrink-0 capitalize"
          >
            {intern.registrationStatus}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectResultCard({ project, idx }: { project: View; idx: number }) {
  return (
    <Card
      className="hover:border-accent/40 transition-colors group"
      data-ocid={`search.project.${idx + 1}`}
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
              <p className="text-xs text-muted-foreground truncate">
                {project.description || "No description"}
              </p>
              {project.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0 rounded-full bg-accent/10 text-accent border border-accent/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge
              variant={
                project.status === "active"
                  ? "default"
                  : project.status === "completed"
                    ? "secondary"
                    : "outline"
              }
              className="text-[10px] px-1.5 py-0 capitalize"
            >
              {project.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {project.assignedInterns.length} intern
              {project.assignedInterns.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  const { query, setQuery, results, loading, clearSearch } = useSearch();
  const hasResults = results.interns.length > 0 || results.projects.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find interns and projects instantly
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, email, project title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-11 text-sm"
          autoFocus
          data-ocid="search.input"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="search.clear_button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
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
            Search across interns and projects
          </p>
        </div>
      )}

      {!loading && query && !hasResults && (
        <Card>
          <CardContent className="py-14 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different name or keyword
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && hasResults && (
        <div className="space-y-8">
          {results.interns.length > 0 && (
            <section>
              <h2 className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Interns &mdash; {results.interns.length} result
                {results.interns.length !== 1 ? "s" : ""}
              </h2>
              <div className="space-y-2">
                {results.interns.map((intern, idx) => (
                  <InternResultCard
                    key={intern.principal.toString()}
                    intern={intern}
                    idx={idx}
                  />
                ))}
              </div>
            </section>
          )}

          {results.projects.length > 0 && (
            <section>
              <h2 className="font-display font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5" />
                Projects &mdash; {results.projects.length} result
                {results.projects.length !== 1 ? "s" : ""}
              </h2>
              <div className="space-y-2">
                {results.projects.map((project, idx) => (
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
      )}
    </div>
  );
}
