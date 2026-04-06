import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { View, View__2 } from "../../backend";
import { Type } from "../../backend";
import { useActor } from "../../hooks/useActor";

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

const emptyForm = { title: "", description: "", startDate: "", endDate: "" };

function AssignInternsDialog({
  project,
  open,
  onOpenChange,
  onSaved,
}: {
  project: View;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { actor } = useActor();
  const [allInterns, setAllInterns] = useState<View__2[]>([]);
  const [loadingInterns, setLoadingInterns] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !actor) return;
    setLoadingInterns(true);
    actor
      .getAllInterns()
      .then((interns) => {
        setAllInterns(interns);
        const currentlyAssigned = new Set(
          project.assignedInterns.map((p) => p.toString()),
        );
        setSelected(currentlyAssigned);
      })
      .catch(() => toast.error("Failed to load interns"))
      .finally(() => setLoadingInterns(false));
  }, [open, actor, project.assignedInterns]);

  const toggleIntern = (principalStr: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(principalStr)) {
        next.delete(principalStr);
      } else {
        next.add(principalStr);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      const originalAssigned = new Set(
        project.assignedInterns.map((p) => p.toString()),
      );

      const toAdd = allInterns.filter(
        (i) =>
          selected.has(i.principal.toString()) &&
          !originalAssigned.has(i.principal.toString()),
      );
      const toRemove = allInterns.filter(
        (i) =>
          !selected.has(i.principal.toString()) &&
          originalAssigned.has(i.principal.toString()),
      );

      await Promise.all([
        ...toAdd.map((i) =>
          actor.assignInternToProject({
            internPrincipal: i.principal,
            projectId: project.id,
          }),
        ),
        ...toRemove.map((i) =>
          actor.unassignInternFromProject({
            internPrincipal: i.principal,
            projectId: project.id,
          }),
        ),
      ]);

      toast.success("Intern assignments saved");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save assignments",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-ocid="projects.dialog">
        <DialogHeader>
          <DialogTitle>Assign Interns</DialogTitle>
          <DialogDescription>
            Select interns to assign to &ldquo;{project.title}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {loadingInterns ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : allInterns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active interns available
          </p>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-1 pr-3">
              {allInterns.map((intern) => {
                const principalStr = intern.principal.toString();
                return (
                  <button
                    key={principalStr}
                    type="button"
                    className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/50 cursor-pointer text-left"
                    onClick={() => toggleIntern(principalStr)}
                  >
                    <Checkbox
                      checked={selected.has(principalStr)}
                      onCheckedChange={() => toggleIntern(principalStr)}
                      data-ocid="projects.checkbox"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {intern.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {intern.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="projects.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loadingInterns}
            data-ocid="projects.save_button"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {saving ? "Saving..." : "Save Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const { actor } = useActor();
  const [projects, setProjects] = useState<View[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<bigint | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<View | null>(null);
  const [assignProject, setAssignProject] = useState<View | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<View | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await actor.getAllProjects();
      setProjects(data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !form.title.trim()) return;
    setSaving(true);
    try {
      await actor.createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      });
      toast.success("Project created");
      setForm(emptyForm);
      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create project",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project: View) => {
    setEditProject(project);
    setEditForm({ ...project });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !editForm) return;
    setSaving(true);
    try {
      await actor.updateProject(editForm);
      toast.success("Project updated");
      setEditProject(null);
      setEditForm(null);
      load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update project",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    setDeleteLoading(id);
    try {
      await actor.removeProject(id);
      toast.success("Project deleted");
      load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete project",
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage internship projects
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gap-2"
              data-ocid="projects.open_modal_button"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-ocid="projects.dialog">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Add a new internship project
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Project title"
                  required
                  data-ocid="projects.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Project description"
                  rows={3}
                  data-ocid="projects.textarea"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">End Date</Label>
                  <Input
                    id="end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  data-ocid="projects.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  data-ocid="projects.submit_button"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {saving ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editProject}
        onOpenChange={(open) => {
          if (!open) {
            setEditProject(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent className="max-w-md" data-ocid="projects.dialog">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  required
                  data-ocid="projects.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                  data-ocid="projects.textarea"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editForm.status as string}
                  onValueChange={(val) =>
                    setEditForm({ ...editForm, status: val as Type })
                  }
                >
                  <SelectTrigger data-ocid="projects.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditProject(null);
                    setEditForm(null);
                  }}
                  data-ocid="projects.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  data-ocid="projects.save_button"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Interns Dialog */}
      {assignProject && (
        <AssignInternsDialog
          project={assignProject}
          open={!!assignProject}
          onOpenChange={(open) => {
            if (!open) setAssignProject(null);
          }}
          onSaved={load}
        />
      )}

      {/* Project List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div
          className="border border-dashed border-border rounded-lg p-12 text-center"
          data-ocid="projects.empty_state"
        >
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mx-auto">
            <FolderKanban
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="text-muted-foreground text-sm mt-3">
            No projects yet. Create your first project.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, idx) => (
            <div
              key={String(project.id)}
              className="bg-card border border-border rounded-lg p-5 shadow-card"
              data-ocid={`projects.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
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
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {(project.startDate || project.endDate) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.startDate || "?"} → {project.endDate || "?"}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project.assignedInterns.length} intern
                      {project.assignedInterns.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAssignProject(project)}
                    className="h-8 text-xs"
                    title="Assign interns"
                    data-ocid={`projects.secondary_button.${idx + 1}`}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Assign
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(project)}
                    className="h-8"
                    data-ocid={`projects.edit_button.${idx + 1}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(project.id)}
                    disabled={deleteLoading === project.id}
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    data-ocid={`projects.delete_button.${idx + 1}`}
                  >
                    {deleteLoading === project.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
