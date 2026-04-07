import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { GanttChartSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

interface TimelineProject {
  id: bigint;
  status: string;
  title: string;
  assignedInterns: Principal[];
  endDate: string;
  description: string;
  startDate: string;
}

interface TimelineMilestone {
  id: bigint;
  internPrincipal: Principal;
  projectId: bigint;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: bigint;
}

interface TimelineActor {
  getAllProjects(): Promise<TimelineProject[]>;
  getAllMilestones(): Promise<TimelineMilestone[]>;
}

const STATUS_COLORS: Record<
  string,
  { bar: string; badge: string; label: string }
> = {
  active: {
    bar: "bg-accent",
    badge: "bg-accent/10 text-accent border-accent/20",
    label: "Active",
  },
  completed: {
    bar: "bg-success",
    badge: "bg-success/10 text-success border-success/20",
    label: "Completed",
  },
  planning: {
    bar: "bg-warning",
    badge: "bg-warning/10 text-warning border-warning/20",
    label: "Planning",
  },
};

const FALLBACK_COLORS = STATUS_COLORS.planning;

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth()
  );
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ROW_HEIGHT = 40;
const LABEL_WIDTH = 200;
const MONTH_WIDTH = 100;
const DIAMOND_SIZE = 10;

interface ProjectWithDates extends TimelineProject {
  parsedStart: Date;
  parsedEnd: Date;
}

export default function TimelinePage() {
  const { actor } = useActor();
  const ext = actor as TimelineActor | null;
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!ext) return;
    setLoading(true);
    try {
      const [projectsData, milestonesData] = await Promise.all([
        ext.getAllProjects(),
        ext.getAllMilestones(),
      ]);
      setProjects(projectsData);
      setMilestones(milestonesData);
    } catch {
      toast.error("Failed to load timeline data");
    } finally {
      setLoading(false);
    }
  }, [ext]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { validProjects, timelineStart, timelineEnd, totalMonths } =
    useMemo(() => {
      const valid: ProjectWithDates[] = projects
        .map((p) => ({
          ...p,
          parsedStart: parseDate(p.startDate) ?? new Date(),
          parsedEnd: parseDate(p.endDate) ?? addDays(new Date(), 30),
        }))
        .filter((p) => p.parsedStart <= p.parsedEnd);

      if (valid.length === 0) {
        const now = new Date();
        return {
          validProjects: [],
          timelineStart: startOfMonth(now),
          timelineEnd: new Date(now.getFullYear(), now.getMonth() + 6, 1),
          totalMonths: 6,
        };
      }

      const allDates = [
        ...valid.map((p) => p.parsedStart),
        ...valid.map((p) => p.parsedEnd),
        ...(milestones
          .map((m) => parseDate(m.dueDate))
          .filter(Boolean) as Date[]),
      ];

      const earliest = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const latest = new Date(Math.max(...allDates.map((d) => d.getTime())));

      const tlStart = startOfMonth(addDays(earliest, -15));
      const tlEnd = new Date(latest.getFullYear(), latest.getMonth() + 2, 1);
      const nMonths = Math.max(monthsBetween(tlStart, tlEnd) + 1, 4);

      return {
        validProjects: valid,
        timelineStart: tlStart,
        timelineEnd: tlEnd,
        totalMonths: nMonths,
      };
    }, [projects, milestones]);

  const dateToX = useCallback(
    (date: Date): number => {
      const totalDays =
        (timelineEnd.getTime() - timelineStart.getTime()) / 86400000;
      const dayOffset = (date.getTime() - timelineStart.getTime()) / 86400000;
      return Math.max(0, (dayOffset / totalDays) * (totalMonths * MONTH_WIDTH));
    },
    [timelineEnd, timelineStart, totalMonths],
  );

  const monthHeaders = useMemo(() => {
    const headers: { label: string; x: number }[] = [];
    let cursor = new Date(timelineStart);
    for (let i = 0; i < totalMonths; i++) {
      headers.push({
        label: `${MONTH_ABBR[cursor.getMonth()]} ${cursor.getFullYear()}`,
        x: i * MONTH_WIDTH,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return headers;
  }, [timelineStart, totalMonths]);

  const totalWidth = totalMonths * MONTH_WIDTH;
  const chartHeight = Math.max(
    (validProjects.length + 1) * ROW_HEIGHT + 32,
    100,
  );

  const milestonesByProject = useMemo(() => {
    const map = new Map<string, TimelineMilestone[]>();
    for (const m of milestones) {
      const key = String(m.projectId);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [milestones]);

  const todayX = dateToX(new Date());

  return (
    <div className="p-6 space-y-6" data-ocid="timeline.page">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <GanttChartSquare className="h-6 w-6 text-accent" />
          Project Timeline
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Gantt-style overview of all projects and milestone due dates
        </p>
      </div>

      {loading ? (
        <div className="space-y-4" data-ocid="timeline.loading_state">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : validProjects.length === 0 ? (
        <div
          className="border border-dashed border-border rounded-lg p-16 text-center"
          data-ocid="timeline.empty_state"
        >
          <GanttChartSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-display text-lg font-semibold text-foreground">
            No projects to display
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Create projects with start and end dates to see the timeline
          </p>
        </div>
      ) : (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Timeline View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div style={{ minWidth: LABEL_WIDTH + totalWidth + 32 }}>
                <div className="flex border-b border-border bg-muted/30">
                  <div
                    className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-muted-foreground"
                    style={{ width: LABEL_WIDTH }}
                  >
                    Project
                  </div>
                  <div
                    className="relative flex-shrink-0"
                    style={{ width: totalWidth }}
                  >
                    {monthHeaders.map((h) => (
                      <div
                        key={h.label}
                        className="absolute top-0 py-2 text-xs font-medium text-muted-foreground border-l border-border/50"
                        style={{ left: h.x, width: MONTH_WIDTH }}
                      >
                        <span className="pl-2">{h.label}</span>
                      </div>
                    ))}
                    <div className="h-8" />
                  </div>
                </div>

                <div className="relative" style={{ height: chartHeight }}>
                  {monthHeaders.map((h) => (
                    <div
                      key={`grid-${h.label}`}
                      className="absolute top-0 bottom-0 border-l border-border/30"
                      style={{ left: LABEL_WIDTH + h.x }}
                    />
                  ))}

                  {todayX >= 0 && todayX <= totalWidth && (
                    <div
                      className="absolute top-0 bottom-0 border-l-2 border-accent/60 border-dashed"
                      style={{ left: LABEL_WIDTH + todayX }}
                    >
                      <span className="absolute top-0 -translate-x-1/2 bg-accent text-accent-foreground text-[9px] px-1 py-0.5 rounded font-medium">
                        Today
                      </span>
                    </div>
                  )}

                  {validProjects.map((project, idx) => {
                    const barX = dateToX(project.parsedStart);
                    const barEndX = dateToX(project.parsedEnd);
                    const barWidth = Math.max(barEndX - barX, 4);
                    const rowY = idx * ROW_HEIGHT + 8;
                    const colors =
                      STATUS_COLORS[project.status] ?? FALLBACK_COLORS;
                    const projectMilestones =
                      milestonesByProject.get(String(project.id)) ?? [];

                    return (
                      <div
                        key={String(project.id)}
                        className="absolute flex items-center"
                        style={{
                          top: rowY,
                          left: 0,
                          right: 0,
                          height: ROW_HEIGHT - 8,
                        }}
                        data-ocid={`timeline.project.item.${idx + 1}`}
                      >
                        <div
                          className="flex-shrink-0 px-4 flex items-center"
                          style={{ width: LABEL_WIDTH }}
                        >
                          <span
                            className="text-sm font-medium truncate text-foreground"
                            title={project.title}
                          >
                            {project.title}
                          </span>
                        </div>

                        <div
                          className="relative flex-shrink-0"
                          style={{ width: totalWidth, height: "100%" }}
                        >
                          <div
                            className={cn(
                              "absolute top-1/2 -translate-y-1/2 h-6 rounded-md opacity-90 transition-opacity hover:opacity-100",
                              colors.bar,
                            )}
                            style={{ left: barX, width: barWidth }}
                            title={`${project.title}: ${project.startDate} → ${project.endDate}`}
                          />

                          {projectMilestones.map((m) => {
                            const mDate = parseDate(m.dueDate);
                            if (!mDate) return null;
                            const mx = dateToX(mDate);
                            if (mx < 0 || mx > totalWidth) return null;
                            return (
                              <div
                                key={String(m.id)}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer group"
                                style={{
                                  left: mx,
                                  width: DIAMOND_SIZE,
                                  height: DIAMOND_SIZE,
                                }}
                                title={`${m.title} (due ${m.dueDate})`}
                              >
                                <div className="w-full h-full rotate-45 bg-foreground border-2 border-background group-hover:scale-125 transition-transform" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-popover border border-border rounded-md px-2 py-1.5 shadow-card whitespace-nowrap">
                                    <p className="text-xs font-medium">
                                      {m.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Due: {m.dueDate}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>

            <div className="px-4 py-3 border-t border-border flex items-center gap-6 flex-wrap">
              {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={cn("h-3 w-6 rounded-sm", colors.bar)} />
                  <span className="text-xs text-muted-foreground">
                    {colors.label}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rotate-45 bg-foreground" />
                <span className="text-xs text-muted-foreground">Milestone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-0 border-l-2 border-dashed border-accent/60" />
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && validProjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {validProjects.map((p) => {
            const colors = STATUS_COLORS[p.status] ?? FALLBACK_COLORS;
            return (
              <Badge
                key={String(p.id)}
                variant="outline"
                className={cn("text-xs border", colors.badge)}
              >
                {p.title}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
