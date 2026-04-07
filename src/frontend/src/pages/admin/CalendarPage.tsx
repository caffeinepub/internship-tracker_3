import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface CalendarMilestone {
  id: bigint;
  internPrincipal: Principal;
  projectId: bigint;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: bigint;
}

interface CalendarActivity {
  id: bigint;
  internPrincipal: Principal;
  title: string;
  hours: bigint;
  date: string;
  createdAt: bigint;
  description: string;
  projectId: bigint;
}

interface CalendarActor {
  getAllMilestones(): Promise<CalendarMilestone[]>;
  getAllActivities(): Promise<CalendarActivity[]>;
}

interface DayData {
  milestones: CalendarMilestone[];
  activities: CalendarActivity[];
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

export default function CalendarPage() {
  const { actor } = useActor();
  const ext = actor as CalendarActor | null;
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [milestones, setMilestones] = useState<CalendarMilestone[]>([]);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!ext) return;
    setLoading(true);
    try {
      const [milestonesData, activitiesData] = await Promise.all([
        ext.getAllMilestones(),
        ext.getAllActivities(),
      ]);
      setMilestones(milestonesData);
      setActivities(activitiesData);
    } catch {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [ext]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateMonth = (delta: number) => {
    setSelectedDay(null);
    const date = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  const dayMap = useMemo(() => {
    const map = new Map<number, DayData>();
    const prefix = `${String(viewYear).padStart(4, "0")}-${String(viewMonth + 1).padStart(2, "0")}-`;

    for (const m of milestones) {
      if (m.dueDate?.startsWith(prefix)) {
        const day = Number.parseInt(m.dueDate.slice(8, 10), 10);
        if (!map.has(day)) map.set(day, { milestones: [], activities: [] });
        map.get(day)!.milestones.push(m);
      }
    }
    for (const a of activities) {
      if (a.date?.startsWith(prefix)) {
        const day = Number.parseInt(a.date.slice(8, 10), 10);
        if (!map.has(day)) map.set(day, { milestones: [], activities: [] });
        map.get(day)!.activities.push(a);
      }
    }
    return map;
  }, [milestones, activities, viewYear, viewMonth]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
  const cells: { key: string; day: number | null }[] = Array.from(
    { length: totalCells },
    (_, i) => {
      const day = i - firstDayOfMonth + 1;
      const isDayCell = day >= 1 && day <= daysInMonth;
      return {
        key: isDayCell ? `day-${day}` : `empty-${i}`,
        day: isDayCell ? day : null,
      };
    },
  );

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  const selectedDayData = selectedDay !== null ? dayMap.get(selectedDay) : null;

  const hasAnyData = [...dayMap.values()].some(
    (d) => d.milestones.length > 0 || d.activities.length > 0,
  );

  return (
    <div className="p-6 space-y-6" data-ocid="calendar.page">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-accent" />
          Calendar
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          View milestone due dates and intern activity across the month
        </p>
      </div>

      {loading ? (
        <div className="space-y-4" data-ocid="calendar.loading_state">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.flatMap((d) =>
              [0, 1, 2, 3, 4].map((w) => (
                <Skeleton key={`skel-${d}-${w}`} className="h-20 rounded-md" />
              )),
            )}
          </div>
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(-1)}
                data-ocid="calendar.pagination_prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-display text-lg font-semibold">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(1)}
                data-ocid="calendar.pagination_next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS_OF_WEEK.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map(({ key, day }) => {
                const data = day !== null ? dayMap.get(day) : undefined;
                const hasMilestones = (data?.milestones.length ?? 0) > 0;
                const hasActivities = (data?.activities.length ?? 0) > 0;
                const isSelected = day === selectedDay;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={day === null}
                    onClick={() =>
                      day !== null && setSelectedDay(isSelected ? null : day)
                    }
                    className={cn(
                      "min-h-[72px] p-1.5 rounded-md text-left transition-colors",
                      day === null
                        ? "cursor-default"
                        : "hover:bg-muted cursor-pointer",
                      isSelected && "ring-2 ring-accent bg-accent/5",
                      isToday(day ?? 0) && !isSelected && "bg-primary/5",
                    )}
                    data-ocid={
                      day !== null ? `calendar.item.${day}` : undefined
                    }
                  >
                    {day !== null && (
                      <>
                        <span
                          className={cn(
                            "text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center",
                            isToday(day)
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground",
                          )}
                        >
                          {day}
                        </span>
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {hasMilestones && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-warning"
                              title="Milestone due"
                            />
                          )}
                          {hasActivities && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-success"
                              title="Activity logged"
                            />
                          )}
                        </div>
                        {hasMilestones && (
                          <div className="hidden sm:block mt-1">
                            <span className="text-[9px] text-warning font-medium leading-none">
                              {data!.milestones.length} milestone
                              {data!.milestones.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                        {hasActivities && (
                          <div className="hidden sm:block">
                            <span className="text-[9px] text-success font-medium leading-none">
                              {data!.activities.length} activity
                              {data!.activities.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-xs text-muted-foreground">
                  Milestone due
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">
                  Activity logged
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDay !== null && (
        <Card
          className="shadow-card border-accent/30"
          data-ocid="calendar.panel"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-base">
                {MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDay(null)}
                className="h-7 w-7"
                data-ocid="calendar.close_button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!selectedDayData ||
            (selectedDayData.milestones.length === 0 &&
              selectedDayData.activities.length === 0) ? (
              <div
                className="py-6 text-center"
                data-ocid="calendar.empty_state"
              >
                <p className="text-muted-foreground text-sm">
                  Nothing scheduled for this day
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayData.milestones.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Flag className="h-3.5 w-3.5 text-warning" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Milestones Due
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedDayData.milestones.map((m, idx) => (
                        <div
                          key={String(m.id)}
                          className="flex items-center justify-between gap-2 px-3 py-2 bg-warning/5 rounded-md border border-warning/15"
                          data-ocid={`calendar.milestone.item.${idx + 1}`}
                        >
                          <span className="text-sm font-medium">{m.title}</span>
                          <MilestoneStatusBadge status={m.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDayData.activities.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Activity className="h-3.5 w-3.5 text-success" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Activities Logged
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedDayData.activities.map((a, idx) => (
                        <div
                          key={String(a.id)}
                          className="flex items-center justify-between gap-2 px-3 py-2 bg-success/5 rounded-md border border-success/15"
                          data-ocid={`calendar.activity.item.${idx + 1}`}
                        >
                          <span className="text-sm font-medium">{a.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Number(a.hours)}h
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && !hasAnyData && selectedDay === null && (
        <div
          className="border border-dashed border-border rounded-lg p-10 text-center"
          data-ocid="calendar.empty_state"
        >
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No milestones or activities for {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
        </div>
      )}
    </div>
  );
}
