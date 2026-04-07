import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  FolderKanban,
  Loader2,
  Pencil,
  Pin,
  Plus,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Type__1, View, View__2 } from "../../backend";
import { Type } from "../../backend";
import { useActor } from "../../hooks/useActor";

// ─── Status Badge ────────────────────────────────────────────────────────────

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

// ─── Tag Manager ─────────────────────────────────────────────────────────────

const TAG_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++)
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function TagManager({
  project,
  onTagAdded,
}: {
  project: View;
  onTagAdded: () => void;
}) {
  const { actor } = useActor();
  const [adding, setAdding] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const addTag = async () => {
    const tag = tagInput.trim();
    if (!actor || !tag) return;
    setSaving(true);
    try {
      await actor.addProjectTag(project.id, tag);
      setTagInput("");
      setAdding(false);
      onTagAdded();
    } catch {
      toast.error("Failed to add tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {project.tags?.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${tagColor(tag)}`}
        >
          <Tag className="h-2.5 w-2.5" />
          {tag}
        </span>
      ))}
      {adding ? (
        <div className="flex items-center gap-1">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTag();
              if (e.key === "Escape") {
                setAdding(false);
                setTagInput("");
              }
            }}
            placeholder="Tag name..."
            className="h-6 w-28 text-xs px-2"
            autoFocus
            data-ocid="projects.tag_input"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={addTag}
            disabled={saving || !tagInput.trim()}
            className="h-6 px-2 text-xs"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAdding(false);
              setTagInput("");
            }}
            className="h-6 px-1 text-xs"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          data-ocid="projects.add_tag_button"
        >
          <Plus className="h-2.5 w-2.5" />
          Add tag
        </button>
      )}
    </div>
  );
}

// ─── Subtask Section ─────────────────────────────────────────────────────────

function SubtaskSection({
  project,
  onUpdate,
}: {
  project: View;
  onUpdate: () => void;
}) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const addSubtask = async () => {
    const title = newTitle.trim();
    if (!actor || !title) return;
    setAdding(true);
    try {
      const dueDateNs = newDueDate
        ? BigInt(new Date(newDueDate).getTime()) * 1_000_000n
        : null;
      await actor.addSubtask(project.id, title, dueDateNs);
      setNewTitle("");
      setNewDueDate("");
      onUpdate();
    } catch {
      toast.error("Failed to add subtask");
    } finally {
      setAdding(false);
    }
  };

  const toggleSubtask = async (subtaskId: string) => {
    if (!actor) return;
    setToggling(subtaskId);
    try {
      await actor.toggleSubtask(project.id, subtaskId);
      onUpdate();
    } catch {
      toast.error("Failed to update subtask");
    } finally {
      setToggling(null);
    }
  };

  const subtasks: Type__1[] = project.subtasks || [];
  const completedCount = subtasks.filter((s) => s.isCompleted).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
          data-ocid="projects.subtasks_toggle"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
          />
          Subtasks
          {subtasks.length > 0 && (
            <span className="ml-1 text-[10px] bg-muted px-1.5 py-0 rounded-full">
              {completedCount}/{subtasks.length}
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1.5 pl-4 border-l border-border">
        {subtasks.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-1">
            No subtasks yet
          </p>
        )}
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2.5 group">
            <Checkbox
              id={subtask.id}
              checked={subtask.isCompleted}
              disabled={toggling === subtask.id}
              onCheckedChange={() => toggleSubtask(subtask.id)}
              className="h-3.5 w-3.5"
              data-ocid="projects.subtask_checkbox"
            />
            <label
              htmlFor={subtask.id}
              className={`text-xs cursor-pointer select-none flex-1 min-w-0 ${
                subtask.isCompleted
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {subtask.title}
            </label>
            {subtask.dueDate && (
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {new Date(
                  Number(subtask.dueDate) / 1_000_000,
                ).toLocaleDateString()}
              </span>
            )}
            {toggling === subtask.id && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
        ))}

        {/* Add subtask inline */}
        <div className="flex items-center gap-1.5 pt-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubtask()}
            placeholder="Add subtask..."
            className="h-6 text-xs px-2 flex-1"
            data-ocid="projects.subtask_input"
          />
          <Input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="h-6 text-xs px-2 w-32"
            title="Due date (optional)"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={addSubtask}
            disabled={adding || !newTitle.trim()}
            className="h-6 px-2 text-xs"
            data-ocid="projects.add_subtask_button"
          >
            {adding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Assign Interns Dialog ───────────────────────────────────────────────────

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
      if (next.has(principalStr)) next.delete(principalStr);
      else next.add(principalStr);
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

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  idx,
  onEdit,
  onDelete,
  onAssign,
  onUpdate,
  deleteLoading,
}: {
  project: View;
  idx: number;
  onEdit: (p: View) => void;
  onDelete: (id: bigint) => void;
  onAssign: (p: View) => void;
  onUpdate: () => void;
  deleteLoading: bigint | null;
}) {
  const { actor } = useActor();
  const [pinning, setPinning] = useState(false);

  const togglePin = async () => {
    if (!actor) return;
    setPinning(true);
    try {
      await actor.toggleProjectPin(project.id);
      onUpdate();
    } catch {
      toast.error("Failed to toggle pin");
    } finally {
      setPinning(false);
    }
  };

  return (
    <div
      className={`bg-card border rounded-lg p-5 shadow-card transition-all ${
        project.isPinned
          ? "border-warning/40 ring-1 ring-warning/20"
          : "border-border"
      }`}
      data-ocid={`projects.item.${idx + 1}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {project.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 font-medium">
                <Pin className="h-2.5 w-2.5" />
                Pinned
              </span>
            )}
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
          <TagManager project={project} onTagAdded={onUpdate} />
          <SubtaskSection project={project} onUpdate={onUpdate} />
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePin}
            disabled={pinning}
            className={`h-8 w-8 p-0 ${
              project.isPinned
                ? "text-warning hover:text-warning hover:bg-warning/10"
                : "text-muted-foreground"
            }`}
            title={project.isPinned ? "Unpin project" : "Pin project"}
            data-ocid={`projects.pin_button.${idx + 1}`}
          >
            {pinning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pin
                className={`h-3.5 w-3.5 ${project.isPinned ? "fill-warning" : ""}`}
              />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAssign(project)}
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
            onClick={() => onEdit(project)}
            className="h-8"
            data-ocid={`projects.edit_button.${idx + 1}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(project.id)}
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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const emptyForm = { title: "", description: "", startDate: "", endDate: "" };

export default function ProjectsPage() {
  const { actor } = useActor();
  const [projects, setProjects] = useState<View[]>([]);
  const [pinnedProjects, setPinnedProjects] = useState<View[]>([]);
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
      const [all, pinned] = await Promise.all([
        actor.getAllProjects(),
        actor.getPinnedProjects(),
      ]);
      setProjects(all);
      setPinnedProjects(pinned);
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

  const handleEdit = (project: View) => {
    setEditProject(project);
    setEditForm({ ...project });
  };

  // Separate pinned from unpinned in the all-projects list to avoid duplication
  const unpinnedProjects = projects.filter((p) => !p.isPinned);

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

      {/* Edit Dialog */}
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

      {/* Assign Dialog */}
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

      {/* Pinned Projects Section */}
      {!loading && pinnedProjects.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Pin className="h-3.5 w-3.5 text-warning fill-warning" />
            Pinned
          </h2>
          <div className="space-y-3">
            {pinnedProjects.map((project, idx) => (
              <ProjectCard
                key={String(project.id)}
                project={project}
                idx={idx}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAssign={setAssignProject}
                onUpdate={load}
                deleteLoading={deleteLoading}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Projects */}
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
        <>
          {unpinnedProjects.length > 0 && (
            <section>
              {pinnedProjects.length > 0 && (
                <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-widest mb-3">
                  All Projects
                </h2>
              )}
              <div className="space-y-3">
                {unpinnedProjects.map((project, idx) => (
                  <ProjectCard
                    key={String(project.id)}
                    project={project}
                    idx={pinnedProjects.length + idx}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAssign={setAssignProject}
                    onUpdate={load}
                    deleteLoading={deleteLoading}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
