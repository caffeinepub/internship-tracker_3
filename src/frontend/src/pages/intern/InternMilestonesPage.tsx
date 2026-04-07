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
import type { Principal } from "@icp-sdk/core/principal";
import { CheckSquare, Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
// Using local ProjectView to avoid Type enum conflict
interface ProjectView {
  id: bigint;
  title: string;
  status: string;
  assignedInterns: { toString(): string }[];
  endDate: string;
  description: string;
  startDate: string;
}
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

type FilterStatus = "all" | "pending" | "inProgress" | "completed";

interface MilestoneView {
  id: bigint;
  internPrincipal: Principal;
  projectId: bigint;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: bigint;
}

interface InternMilestonesActor {
  getMilestonesForIntern(intern: Principal): Promise<MilestoneView[]>;
  getAllProjects(): Promise<
    {
      id: bigint;
      title: string;
      status: string;
      assignedInterns: Principal[];
      endDate: string;
      description: string;
      startDate: string;
    }[]
  >;
  updateMilestoneStatus(milestoneId: bigint, status: string): Promise<void>;
}

export function MilestoneStatusBadge({ status }: { status: string }) {
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

export default function InternMilestonesPage() {
  const { actor } = useActor();
  const ext = actor as InternMilestonesActor | null;
  const { identity } = useInternetIdentity();

  const [milestones, setMilestones] = useState<MilestoneView[]>([]);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [updatingId, setUpdatingId] = useState<bigint | null>(null);

  const fetchData = useCallback(async () => {
    if (!ext || !identity) return;
    setLoading(true);
    try {
      const principal = identity.getPrincipal();
      const [milestonesData, projectsData] = await Promise.all([
        ext.getMilestonesForIntern(principal),
        ext.getAllProjects(),
      ]);
      setMilestones(milestonesData);
      setProjects(projectsData);
    } catch {
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  }, [ext, identity]);

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

  const handleStatusUpdate = async (milestoneId: bigint, newStatus: string) => {
    if (!ext) return;
    setUpdatingId(milestoneId);
    try {
      await ext.updateMilestoneStatus(milestoneId, newStatus);
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId ? { ...m, status: newStatus } : m,
        ),
      );
      toast.success("Milestone status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = milestones.filter((m) => m.status === "pending").length;
  const inProgressCount = milestones.filter(
    (m) => m.status === "inProgress",
  ).length;
  const completedCount = milestones.filter(
    (m) => m.status === "completed",
  ).length;

  return (
    <div className="p-6 space-y-6" data-ocid="intern.milestones.page">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            My Milestones
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track your progress across all assigned projects
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          data-ocid="intern.milestones.secondary_button"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      {!loading && milestones.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/40 rounded-lg border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </div>
          <div className="bg-warning/5 rounded-lg border border-warning/20 p-3 text-center">
            <p className="text-2xl font-bold text-warning">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">In Progress</p>
          </div>
          <div className="bg-success/5 rounded-lg border border-success/20 p-3 text-center">
            <p className="text-2xl font-bold text-success">{completedCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="flex items-center gap-3 flex-wrap"
        data-ocid="intern.milestones.section"
      >
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
            data-ocid="intern.milestones.search_input"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as FilterStatus)}
        >
          <SelectTrigger
            className="w-40 h-9"
            data-ocid="intern.milestones.select"
          >
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

      {/* Content */}
      {loading ? (
        <div className="space-y-2" data-ocid="intern.milestones.loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="border border-dashed border-border rounded-lg p-12 text-center"
          data-ocid="intern.milestones.empty_state"
        >
          <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "No milestones match your filters"
              : "No milestones assigned yet"}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <p className="text-sm text-muted-foreground/70 mt-1">
              Milestones will appear here once your admin creates them for your
              projects
            </p>
          )}
        </div>
      ) : (
        <div
          className="border border-border rounded-lg overflow-hidden"
          data-ocid="intern.milestones.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Project
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Milestone
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Due Date
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Update Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((milestone, idx) => (
                <TableRow
                  key={String(milestone.id)}
                  data-ocid={`intern.milestones.row.${idx + 1}`}
                >
                  <TableCell className="text-sm text-muted-foreground">
                    {projectMap.get(String(milestone.projectId)) ||
                      `Project #${milestone.projectId}`}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    <div>
                      {milestone.title}
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <MilestoneStatusBadge status={milestone.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {milestone.dueDate || "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={milestone.status}
                      onValueChange={(v) => handleStatusUpdate(milestone.id, v)}
                      disabled={updatingId === milestone.id}
                    >
                      <SelectTrigger
                        className="w-36 h-7 text-xs"
                        data-ocid={`intern.milestones.select.${idx + 1}`}
                      >
                        {updatingId === milestone.id ? (
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
