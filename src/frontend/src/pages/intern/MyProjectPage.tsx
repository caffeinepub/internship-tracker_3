import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, FolderKanban, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import type { View } from "../../backend";
import { Type } from "../../backend";
import { useActor } from "../../hooks/useActor";
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

export default function MyProjectPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
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
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    })();
  }, [actor, identity]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          My Projects
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Projects assigned to you
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No projects assigned yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Your admin will assign you to a project soon
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card key={String(project.id)} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="font-display text-lg">
                    {project.title}
                  </CardTitle>
                  <ProjectStatusBadge status={project.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {project.startDate ? project.startDate : "?"} →{" "}
                        {project.endDate ? project.endDate : "Ongoing"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {project.assignedInterns.length} intern
                      {project.assignedInterns.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
