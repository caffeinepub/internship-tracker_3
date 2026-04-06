import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CheckCircle2, FolderKanban } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import type { View } from "../../backend";
import { Type } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useAuth } from "../../hooks/useAuth";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

function ProjectStatusBadge({ status }: { status: Type }) {
  if (status === Type.active)
    return (
      <Badge className="bg-success/10 text-success border-success/20 border text-xs">
        Active
      </Badge>
    );
  if (status === Type.completed)
    return (
      <Badge className="bg-accent/10 text-accent border-accent/20 border text-xs">
        Completed
      </Badge>
    );
  return (
    <Badge className="bg-muted text-muted-foreground border border-border text-xs">
      Planning
    </Badge>
  );
}

export default function InternDashboard() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { profile } = useAuth();
  const [projects, setProjects] = useState<View[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || !identity) return;
    (async () => {
      setLoading(true);
      try {
        const principal = identity.getPrincipal();
        const data = await actor.getProjectsForIntern(principal);
        setProjects(data);
      } catch {
        toast.error("Failed to load your projects");
      } finally {
        setLoading(false);
      }
    })();
  }, [actor, identity]);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Welcome back, {profile?.name || "Intern"}!
            </h1>
            <p className="text-muted-foreground text-sm">
              Here's your internship overview
            </p>
          </div>
          <Badge className="bg-success/10 text-success border-success/20 border">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Active
          </Badge>
        </div>
        {profile && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                {profile.email || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned Projects</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {loading ? "..." : projects.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Skills</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {profile.skills?.length || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assigned Projects */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-foreground">
          Your Projects
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-10 text-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No projects assigned yet
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <Card key={String(project.id)} className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-foreground">
                        {project.title}
                      </h3>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    {(project.startDate || project.endDate) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.startDate || "?"} → {project.endDate || "?"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
