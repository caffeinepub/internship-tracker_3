import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ClipboardList, Clock, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { View, View__4 } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

const emptyForm = {
  projectId: "",
  title: "",
  description: "",
  date: "",
  hours: "",
};

export default function ActivityLogPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [projects, setProjects] = useState<View[]>([]);
  const [activities, setActivities] = useState<View__4[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadProjects = useCallback(async () => {
    if (!actor || !identity) return;
    setLoadingProjects(true);
    try {
      const data = await actor.getProjectsForIntern(identity.getPrincipal());
      setProjects(data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }, [actor, identity]);

  const loadActivities = useCallback(async () => {
    if (!actor || !identity) return;
    setLoadingActivities(true);
    try {
      const data = await actor.getActivitiesForIntern(identity.getPrincipal());
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      setActivities(sorted);
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoadingActivities(false);
    }
  }, [actor, identity]);

  useEffect(() => {
    loadProjects();
    loadActivities();
  }, [loadProjects, loadActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !actor ||
      !form.projectId ||
      !form.title.trim() ||
      !form.date ||
      !form.hours
    )
      return;
    const hoursNum = Number(form.hours);
    if (hoursNum < 1 || hoursNum > 24) {
      toast.error("Hours must be between 1 and 24");
      return;
    }
    setSubmitting(true);
    try {
      await actor.logActivity(
        BigInt(form.projectId),
        form.title.trim(),
        form.description.trim(),
        form.date,
        BigInt(hoursNum),
      );
      toast.success("Activity logged successfully");
      setForm(emptyForm);
      await loadActivities();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to log activity",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getProjectTitle = (projectId: bigint) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.title ?? `Project #${String(projectId)}`;
  };

  const totalHours = activities.reduce((sum, a) => sum + Number(a.hours), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Activity Log
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track your work hours and progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Hours
            </p>
            <p className="font-display text-2xl font-bold mt-1">{totalHours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Entries
            </p>
            <p className="font-display text-2xl font-bold mt-1">
              {activities.length}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Projects
            </p>
            <p className="font-display text-2xl font-bold mt-1">
              {projects.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Log Form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Log Work Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Project *</Label>
                {loadingProjects ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={form.projectId}
                    onValueChange={(val) =>
                      setForm({ ...form, projectId: val })
                    }
                  >
                    <SelectTrigger data-ocid="activity.select">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={String(p.id)} value={String(p.id)}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="act-title">Title *</Label>
                <Input
                  id="act-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="What did you work on?"
                  required
                  data-ocid="activity.input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="act-desc">Description</Label>
              <Textarea
                id="act-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe what you accomplished..."
                rows={3}
                data-ocid="activity.textarea"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="act-date">Date *</Label>
                <Input
                  id="act-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="act-hours">Hours (1–24) *</Label>
                <Input
                  id="act-hours"
                  type="number"
                  min={1}
                  max={24}
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  placeholder="Hours worked"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting || !form.projectId}
                data-ocid="activity.submit_button"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {submitting ? "Logging..." : "Log Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Activity List */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-lg">Recent Activity</h2>
        {loadingActivities ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div
            className="border border-dashed border-border rounded-lg p-10 text-center"
            data-ocid="activity.empty_state"
          >
            <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              No activity logs yet. Log your first work entry above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity, idx) => (
              <div
                key={String(activity.id)}
                className="bg-card border border-border rounded-lg p-4 flex items-start gap-4"
                data-ocid={`activity.item.${idx + 1}`}
              >
                <div className="h-9 w-9 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {getProjectTitle(activity.projectId)}
                    </Badge>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.date}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="font-display font-bold text-lg">
                    {Number(activity.hours)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-0.5">
                    hrs
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
