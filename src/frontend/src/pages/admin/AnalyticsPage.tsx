import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  BarChart2,
  CheckCircle2,
  Clock,
  Flag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type {
  View__3 as ActivityLogView,
  View as ProjectView,
} from "../../backend";
import type { backendInterface } from "../../backend";
import { useActor } from "../../hooks/useActor";

interface AnalyticsSummary {
  totalHours: bigint;
  totalActivities: bigint;
  totalMilestones: bigint;
  completedMilestones: bigint;
  activeInternCount: bigint;
  projectCount: bigint;
  hoursByProject: Array<[bigint, bigint]>;
  recentActivities: ActivityLogView[];
}

interface ExtendedActor extends backendInterface {
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-bold mt-1">{value}</p>
          </div>
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((date.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
  );
  return `W${weekNum}`;
}

const CHART_COLORS = [
  "#2dd4bf",
  "#22d3ee",
  "#38bdf8",
  "#60a5fa",
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
];

export default function AnalyticsPage() {
  const { actor } = useActor();
  const ext = actor as ExtendedActor | null;
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ext) return;
    (async () => {
      setLoading(true);
      try {
        const [summaryData, projectsData] = await Promise.all([
          ext.getAnalyticsSummary(),
          ext.getAllProjects(),
        ]);
        setSummary(summaryData);
        setProjects(projectsData);
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, [ext]);

  const projectMap = new Map<string, string>(
    projects.map((p) => [String(p.id), p.title]),
  );

  const hoursByProjectData = summary
    ? summary.hoursByProject
        .map(([projectId, hours]) => ({
          name: projectMap.get(String(projectId)) || `Project ${projectId}`,
          hours: Number(hours),
        }))
        .filter((d) => d.hours > 0)
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 8)
    : [];

  const activityByWeekData = summary
    ? (() => {
        const weekCounts: Record<string, number> = {};
        for (const activity of summary.recentActivities) {
          const week = getWeekLabel(activity.date);
          weekCounts[week] = (weekCounts[week] || 0) + 1;
        }
        return Object.entries(weekCounts)
          .map(([week, count]) => ({ week, count }))
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-8);
      })()
    : [];

  const completionPct = summary
    ? summary.totalMilestones > 0n
      ? Math.round(
          (Number(summary.completedMilestones) /
            Number(summary.totalMilestones)) *
            100,
        )
      : 0
    : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6" data-ocid="analytics.loading_state">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-ocid="analytics.page">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-accent" />
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Overview of intern activity and project progress
        </p>
      </div>

      {/* Stat Cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="analytics.section"
      >
        <StatCard
          icon={Clock}
          label="Total Hours Logged"
          value={Number(summary?.totalHours ?? 0)}
          color="bg-accent/10 text-accent"
        />
        <StatCard
          icon={Activity}
          label="Total Activities"
          value={Number(summary?.totalActivities ?? 0)}
          color="bg-success/10 text-success"
        />
        <StatCard
          icon={Flag}
          label="Total Milestones"
          value={Number(summary?.totalMilestones ?? 0)}
          color="bg-warning/10 text-warning"
        />
        <StatCard
          icon={Users}
          label="Active Interns"
          value={Number(summary?.activeInternCount ?? 0)}
          color="bg-primary/10 text-primary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours by Project */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Hours by Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hoursByProjectData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                No activity data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={hoursByProjectData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.88 0.012 245)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "oklch(0.52 0.02 250)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.52 0.02 250)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(1 0 0)",
                      border: "1px solid oklch(0.88 0.012 245)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} hrs`, "Hours"]}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {hoursByProjectData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Activity by Week */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              Activity Count by Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityByWeekData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                No recent activity data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={activityByWeekData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.88 0.012 245)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: "oklch(0.52 0.02 250)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.52 0.02 250)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(1 0 0)",
                      border: "1px solid oklch(0.88 0.012 245)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value, "Activities"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="oklch(0.65 0.18 145)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestone Progress */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Flag className="h-4 w-4 text-warning" />
            Milestone Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Milestones</p>
              <p className="font-display text-3xl font-bold">
                {Number(summary?.totalMilestones ?? 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-display text-3xl font-bold text-success">
                {Number(summary?.completedMilestones ?? 0)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-sm font-semibold">{completionPct}%</p>
              </div>
              <Progress value={completionPct} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Number(summary?.totalMilestones ?? 0) -
                  Number(summary?.completedMilestones ?? 0)}{" "}
                remaining
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!summary || summary.recentActivities.length === 0 ? (
            <div
              className="py-8 text-center text-sm text-muted-foreground"
              data-ocid="analytics.empty_state"
            >
              No recent activities logged
            </div>
          ) : (
            <div className="space-y-3" data-ocid="analytics.list">
              {summary.recentActivities.slice(0, 10).map((activity, idx) => (
                <div
                  key={String(activity.id)}
                  className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  data-ocid={`analytics.item.${idx + 1}`}
                >
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-xs flex-shrink-0"
                      >
                        {Number(activity.hours)}h
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.description && `${activity.description} · `}
                      {activity.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
