import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Flag, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  View__6 as MilestoneView,
  View as ProjectView,
} from "../../backend";
import { useActor } from "../../hooks/useActor";

type FilterStatus = "all" | "pending" | "inProgress" | "completed";

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

function truncatePrincipal(principal: { toString(): string }): string {
  const str = principal.toString();
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}...${str.slice(-6)}`;
}

export default function AdminMilestonesPage() {
  const { actor } = useActor();
  const [milestones, setMilestones] = useState<MilestoneView[]>([]);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const fetchData = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [milestonesData, projectsData] = await Promise.all([
        actor.getAllMilestones(),
        actor.getAllProjects(),
      ]);
      setMilestones(milestonesData);
      setProjects(projectsData);
    } catch {
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const projectMap = new Map<string, string>(
    projects.map((p) => [String(p.id), p.title]),
  );

  const filtered = milestones.filter((m) => {
    const matchesSearch = searchQuery
      ? m.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus =
      filterStatus === "all" ? true : m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <div className="p-6 space-y-6" data-ocid="milestones.page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Flag className="h-6 w-6 text-warning" />
            All Milestones
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track milestone progress across all interns and projects
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          data-ocid="milestones.secondary_button"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-3 flex-wrap"
        data-ocid="milestones.section"
      >
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            data-ocid="milestones.search_input"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as FilterStatus)}
        >
          <SelectTrigger className="w-40 h-9" data-ocid="milestones.select">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inProgress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2" data-ocid="milestones.loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="border border-dashed border-border rounded-lg p-12 text-center"
          data-ocid="milestones.empty_state"
        >
          <Flag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "No milestones match your filters"
              : "No milestones created yet"}
          </p>
        </div>
      ) : (
        <div
          className="border border-border rounded-lg overflow-hidden"
          data-ocid="milestones.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Intern
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Project
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Title
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Due Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((milestone, idx) => (
                <TableRow
                  key={String(milestone.id)}
                  data-ocid={`milestones.row.${idx + 1}`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {truncatePrincipal(milestone.internPrincipal)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {projectMap.get(String(milestone.projectId)) ||
                      `#${milestone.projectId}`}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {milestone.title}
                  </TableCell>
                  <TableCell>
                    <MilestoneStatusBadge status={milestone.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {milestone.dueDate || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {sorted.length} of {milestones.length} milestones
        </p>
      )}
    </div>
  );
}
