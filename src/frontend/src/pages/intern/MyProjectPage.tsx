import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Flag,
  FolderKanban,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { View as ProjectView, backendInterface } from "../../backend";
import { Type as ProjectStatus, type Type } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

interface MilestoneView {
  id: bigint;
  projectId: bigint;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: bigint;
}

interface ExtendedActor extends backendInterface {
  getMilestonesForProject(projectId: bigint): Promise<MilestoneView[]>;
  createMilestone(arg: {
    projectId: bigint;
    title: string;
    description: string;
    dueDate: string;
  }): Promise<MilestoneView>;
  updateMilestoneStatus(milestoneId: bigint, status: string): Promise<void>;
}

function ProjectStatusBadge({ status }: { status: Type }) {
  if (status === ProjectStatus.active)
    return (
      <Badge className="bg-success/10 text-success border-success/20 border text-xs">
        Active
      </Badge>
    );
  if (status === ProjectStatus.completed)
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

function MilestoneStatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <Badge className="bg-success/10 text-success border border-success/20 text-xs">
        Completed
      </Badge>
    );
  }
  if (status === "inProgress") {
    return (
      <Badge className="bg-warning/10 text-warning border border-warning/20 text-xs">
        In Progress
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border border-border text-xs">
      Pending
    </Badge>
  );
}

interface MilestoneSectionProps {
  projectId: bigint;
  actor: ExtendedActor | null;
}

function MilestoneSection({ projectId, actor }: MilestoneSectionProps) {
  const [open, setOpen] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneView[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<bigint | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const fetchMilestones = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await actor.getMilestonesForProject(projectId);
      setMilestones(
        data.sort((a, b) => Number(b.createdAt) - Number(a.createdAt)),
      );
    } catch {
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && milestones.length === 0) {
      fetchMilestones();
    }
  };

  const handleAddMilestone = async () => {
    if (!actor || !newTitle.trim()) return;
    setSubmitting(true);
    try {
      const created = await actor.createMilestone({
        projectId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        dueDate: newDueDate,
      });
      setMilestones((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      setShowAddForm(false);
      toast.success("Milestone added!");
    } catch {
      toast.error("Failed to add milestone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (milestoneId: bigint, newStatus: string) => {
    if (!actor) return;
    setUpdatingId(milestoneId);
    try {
      await actor.updateMilestoneStatus(milestoneId, newStatus);
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId ? { ...m, status: newStatus } : m,
        ),
      );
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          data-ocid="milestone.toggle"
        >
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Flag className="h-4 w-4" />
          <span>Milestones</span>
          {milestones.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {milestones.length}
            </Badge>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-2 space-y-3">
          {loading ? (
            <div className="space-y-2" data-ocid="milestone.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <>
              {milestones.length === 0 && !showAddForm && (
                <p
                  className="text-sm text-muted-foreground py-2"
                  data-ocid="milestone.empty_state"
                >
                  No milestones yet for this project.
                </p>
              )}

              {milestones.map((m, idx) => (
                <div
                  key={String(m.id)}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                  data-ocid={`milestone.item.${idx + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{m.title}</p>
                      <MilestoneStatusBadge status={m.status} />
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.description}
                      </p>
                    )}
                    {m.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {m.dueDate}
                      </p>
                    )}
                  </div>
                  <Select
                    value={m.status}
                    onValueChange={(v) => handleStatusUpdate(m.id, v)}
                    disabled={updatingId === m.id}
                  >
                    <SelectTrigger
                      className="w-32 h-7 text-xs"
                      data-ocid={`milestone.select.${idx + 1}`}
                    >
                      {updatingId === m.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inProgress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {showAddForm ? (
                <div
                  className="p-3 border border-border rounded-lg space-y-3 bg-card"
                  data-ocid="milestone.panel"
                >
                  <p className="text-sm font-semibold">New Milestone</p>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Title *</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Complete user research"
                        className="h-8 text-sm mt-1"
                        data-ocid="milestone.input"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Brief description..."
                        className="text-sm mt-1 min-h-[60px]"
                        data-ocid="milestone.textarea"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Due Date</Label>
                      <Input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddMilestone}
                      disabled={submitting || !newTitle.trim()}
                      className="h-8 text-xs"
                      data-ocid="milestone.submit_button"
                    >
                      {submitting ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      {submitting ? "Adding..." : "Add Milestone"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewTitle("");
                        setNewDescription("");
                        setNewDueDate("");
                      }}
                      className="h-8 text-xs"
                      data-ocid="milestone.cancel_button"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="w-full h-8 text-xs border-dashed"
                  data-ocid="milestone.open_modal_button"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Milestone
                </Button>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function MyProjectPage() {
  const { actor } = useActor();
  const ext = actor as ExtendedActor | null;
  const { identity } = useInternetIdentity();
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ext || !identity) return;
    (async () => {
      setLoading(true);
      try {
        const principal = identity.getPrincipal();
        const data = await ext.getProjectsForIntern(principal);
        setProjects(data);
      } catch {
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    })();
  }, [ext, identity]);

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
            <Card
              key={String(project.id)}
              className="shadow-card overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="font-display text-lg">
                    {project.title}
                  </CardTitle>
                  <ProjectStatusBadge status={project.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-0">
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
              <MilestoneSection projectId={project.id} actor={ext} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
