import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Clock, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { View, View__3 } from "../../backend";
import { useActor } from "../../hooks/useActor";

function truncatePrincipal(principal: string) {
  if (principal.length <= 14) return principal;
  return `${principal.slice(0, 7)}...${principal.slice(-5)}`;
}

export default function AdminActivityPage() {
  const { actor } = useActor();
  const [activities, setActivities] = useState<View__3[]>([]);
  const [projects, setProjects] = useState<View[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [acts, projs] = await Promise.all([
        actor.getAllActivities(),
        actor.getAllProjects(),
      ]);
      const sorted = [...acts].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      setActivities(sorted);
      setProjects(projs);
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject =
        filterProjectId === "all" || String(a.projectId) === filterProjectId;
      return matchesSearch && matchesProject;
    });
  }, [activities, searchQuery, filterProjectId]);

  const projectHoursSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activities) {
      const key = String(a.projectId);
      map.set(key, (map.get(key) ?? 0) + Number(a.hours));
    }
    return map;
  }, [activities]);

  const getProjectTitle = (projectId: bigint) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.title ?? `#${String(projectId)}`;
  };

  const totalHours = activities.reduce((sum, a) => sum + Number(a.hours), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Activity Logs
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          All intern activity across every project
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Entries
            </p>
            <p className="font-display text-2xl font-bold mt-1">
              {activities.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Hours
            </p>
            <p className="font-display text-2xl font-bold mt-1">{totalHours}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Hours by Project
            </p>
            {loading ? (
              <Skeleton className="h-5 w-full" />
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <Badge
                    key={String(p.id)}
                    variant="secondary"
                    className="text-xs gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {p.title}: {projectHoursSummary.get(String(p.id)) ?? 0}h
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-ocid="activity.search_input"
          />
        </div>
        <Select value={filterProjectId} onValueChange={setFilterProjectId}>
          <SelectTrigger className="w-full sm:w-48" data-ocid="activity.select">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={String(p.id)} value={String(p.id)}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="p-10 text-center text-muted-foreground text-sm"
            data-ocid="activity.empty_state"
          >
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No activity logs found
          </div>
        ) : (
          <Table data-ocid="activity.table">
            <TableHeader>
              <TableRow>
                <TableHead>Intern</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((activity, idx) => (
                <TableRow
                  key={String(activity.id)}
                  data-ocid={`activity.item.${idx + 1}`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {truncatePrincipal(activity.internPrincipal.toString())}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getProjectTitle(activity.projectId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {activity.title}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {Number(activity.hours)}
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">
                      hrs
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {activity.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
