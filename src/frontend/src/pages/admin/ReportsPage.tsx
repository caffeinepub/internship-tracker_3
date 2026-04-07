import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import {
  Activity,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FolderKanban,
  Loader2,
  Printer,
  TrendingUp,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

interface InternProfile {
  bio: string;
  principal: Principal;
  name: string;
  email: string;
  registrationStatus: string;
  skills: string[];
}

interface ActivityEntry {
  id: bigint;
  internPrincipal: Principal;
  title: string;
  hours: bigint;
  date: string;
  createdAt: bigint;
  description: string;
  projectId: bigint;
}

interface ProjectEntry {
  id: bigint;
  status: string;
  title: string;
  assignedInterns: Principal[];
  endDate: string;
  description: string;
  startDate: string;
}

interface MilestoneEntry {
  id: bigint;
  internPrincipal: Principal;
  projectId: bigint;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: bigint;
}

interface ReportsActor {
  getAllInterns(): Promise<InternProfile[]>;
  getProjectsForIntern(intern: Principal): Promise<ProjectEntry[]>;
  getMilestonesForIntern(intern: Principal): Promise<MilestoneEntry[]>;
  getActivitiesForIntern(intern: Principal): Promise<ActivityEntry[]>;
}

interface InternReport {
  intern: InternProfile;
  projects: ProjectEntry[];
  milestones: MilestoneEntry[];
  activities: ActivityEntry[];
}

function ProjectStatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge className="bg-accent/10 text-accent border border-accent/20 text-xs">
        Active
      </Badge>
    );
  }
  if (status === "completed") {
    return (
      <Badge className="bg-success/10 text-success border border-success/20 text-xs">
        Completed
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning/10 text-warning border border-warning/20 text-xs">
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

export default function ReportsPage() {
  const { actor } = useActor();
  const ext = actor as ReportsActor | null;
  const [interns, setInterns] = useState<InternProfile[]>([]);
  const [selectedPrincipal, setSelectedPrincipal] = useState<string>("");
  const [report, setReport] = useState<InternReport | null>(null);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const fetchInterns = useCallback(async () => {
    if (!ext) return;
    setLoadingInterns(true);
    try {
      const data = await ext.getAllInterns();
      setInterns(data);
    } catch {
      toast.error("Failed to load interns");
    } finally {
      setLoadingInterns(false);
    }
  }, [ext]);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  const loadReport = useCallback(
    async (principalStr: string) => {
      if (!ext || !principalStr) return;
      const intern = interns.find(
        (i) => i.principal.toString() === principalStr,
      );
      if (!intern) return;

      setLoadingReport(true);
      setReport(null);
      try {
        const [projects, milestones, activities] = await Promise.all([
          ext.getProjectsForIntern(intern.principal),
          ext.getMilestonesForIntern(intern.principal),
          ext.getActivitiesForIntern(intern.principal),
        ]);
        setReport({ intern, projects, milestones, activities });
      } catch {
        toast.error("Failed to load intern report");
      } finally {
        setLoadingReport(false);
      }
    },
    [ext, interns],
  );

  const handleSelectIntern = (value: string) => {
    setSelectedPrincipal(value);
    loadReport(value);
  };

  const handleExportCsv = async () => {
    if (!ext) return;
    setExportingCsv(true);
    try {
      const allInterns = await ext.getAllInterns();
      const rows = await Promise.all(
        allInterns.map(async (intern) => {
          const [projects, milestones, activities] = await Promise.all([
            ext.getProjectsForIntern(intern.principal),
            ext.getMilestonesForIntern(intern.principal),
            ext.getActivitiesForIntern(intern.principal),
          ]);
          const totalHoursVal = activities.reduce(
            (sum, a) => sum + Number(a.hours),
            0,
          );
          const completedMilestonesVal = milestones.filter(
            (m) => m.status === "completed",
          ).length;
          const completionRateVal = milestones.length
            ? Math.round((completedMilestonesVal / milestones.length) * 100)
            : 0;
          const projectTitles = projects.map((p) => p.title).join(" | ");
          const latestActivity =
            activities.length > 0
              ? [...activities].sort((a, b) => b.date.localeCompare(a.date))[0]
                  .date
              : "N/A";
          return [
            intern.name,
            intern.email,
            totalHoursVal,
            activities.length,
            projects.length,
            completedMilestonesVal,
            completionRateVal,
            projectTitles,
            latestActivity,
          ];
        }),
      );

      const headers = [
        "Name",
        "Email",
        "Total Hours",
        "Activity Count",
        "Project Count",
        "Milestones Completed",
        "Milestone Completion Rate (%)",
        "Project Titles",
        "Latest Activity Date",
      ];

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" &&
              (cell.includes(",") || cell.includes('"'))
                ? `"${cell.replace(/"/g, '""')}"`
                : String(cell),
            )
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `intern-reports-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setExportingCsv(false);
    }
  };

  const totalHours = report
    ? report.activities.reduce((sum, a) => sum + Number(a.hours), 0)
    : 0;
  const completedMilestones = report
    ? report.milestones.filter((m) => m.status === "completed").length
    : 0;
  const completionRate = report?.milestones.length
    ? Math.round((completedMilestones / report.milestones.length) * 100)
    : 0;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; }
          body { background: white !important; }
          .shadow-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <div className="p-6 space-y-6 print-page" data-ocid="reports.page">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap no-print">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent" />
              Performance Reports
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              View and export detailed performance summaries per intern
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="gap-2"
              data-ocid="reports.secondary_button"
            >
              {exportingCsv ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exportingCsv ? "Exporting..." : "Export All as CSV"}
            </Button>
            {report && (
              <Button
                onClick={() => window.print()}
                className="gap-2"
                data-ocid="reports.primary_button"
              >
                <Printer className="h-4 w-4" />
                Print / Export
              </Button>
            )}
          </div>
        </div>

        {/* Intern Selector */}
        <Card className="shadow-card no-print">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <label
                htmlFor="intern-select"
                className="text-sm font-medium text-foreground"
              >
                Select Intern:
              </label>
              {loadingInterns ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                <Select
                  value={selectedPrincipal}
                  onValueChange={handleSelectIntern}
                >
                  <SelectTrigger className="w-64" data-ocid="reports.select">
                    <SelectValue placeholder="Choose an intern..." />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.map((intern) => (
                      <SelectItem
                        key={intern.principal.toString()}
                        value={intern.principal.toString()}
                      >
                        {intern.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {loadingReport && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {!report && !loadingReport && (
          <div
            className="border border-dashed border-border rounded-lg p-16 text-center"
            data-ocid="reports.empty_state"
          >
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-display text-lg font-semibold text-foreground">
              No intern selected
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Select an intern above to view their performance report
            </p>
          </div>
        )}

        {/* Loading State */}
        {loadingReport && (
          <div className="space-y-4" data-ocid="reports.loading_state">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        )}

        {/* Report Content */}
        {report && !loadingReport && (
          <div className="space-y-6">
            {/* Report Header (visible on print) */}
            <div className="hidden print:block mb-6">
              <h1 className="text-2xl font-bold">
                Performance Report — {report.intern.name}
              </h1>
              <p className="text-gray-500 text-sm">
                {report.intern.email} · Generated on{" "}
                {new Date().toLocaleDateString()}
              </p>
              <hr className="mt-3" />
            </div>

            {/* Summary Stats */}
            <div
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              data-ocid="reports.section"
            >
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Hours
                      </p>
                      <p className="font-display text-2xl font-bold mt-1">
                        {totalHours}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Activities
                      </p>
                      <p className="font-display text-2xl font-bold mt-1">
                        {report.activities.length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Projects</p>
                      <p className="font-display text-2xl font-bold mt-1">
                        {report.projects.length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-muted-foreground">
                        Milestone Rate
                      </p>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <p className="font-display text-2xl font-bold">
                      {completionRate}%
                    </p>
                    <Progress value={completionRate} className="h-1.5 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {completedMilestones}/{report.milestones.length} done
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assigned Projects */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Assigned Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {report.projects.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No projects assigned
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Project
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Start Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          End Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.projects.map((project, idx) => (
                        <TableRow
                          key={String(project.id)}
                          data-ocid={`reports.project.item.${idx + 1}`}
                        >
                          <TableCell className="font-medium text-sm">
                            {project.title}
                          </TableCell>
                          <TableCell>
                            <ProjectStatusBadge status={project.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {project.startDate || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {project.endDate || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {report.milestones.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No milestones assigned
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Title
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Due Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.milestones.map((milestone, idx) => (
                        <TableRow
                          key={String(milestone.id)}
                          data-ocid={`reports.milestone.item.${idx + 1}`}
                        >
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
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" />
                  Recent Activity Entries
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {report.activities.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No activity logged yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Title
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Hours
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                          Description
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...report.activities]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .slice(0, 20)
                        .map((activity, idx) => (
                          <TableRow
                            key={String(activity.id)}
                            data-ocid={`reports.activity.item.${idx + 1}`}
                          >
                            <TableCell className="font-medium text-sm">
                              {activity.title}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {activity.date}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {Number(activity.hours)}h
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {activity.description || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Print footer */}
            <div className="hidden print:block mt-6 pt-4 border-t">
              <p className="text-xs text-gray-400 text-center">
                Internship Tracker — Confidential Performance Report
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
