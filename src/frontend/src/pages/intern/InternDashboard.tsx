import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Megaphone,
  Star,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Type__10, Type__15, View } from "../../backend";
import { Type } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useAuth } from "../../hooks/useAuth";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function StarRating({ score }: { score: number }) {
  const full = Math.floor(score);
  const hasHalf = score - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= full
              ? "text-warning fill-warning"
              : i === full + 1 && hasHalf
                ? "text-warning fill-warning/40"
                : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="text-sm font-semibold text-foreground ml-1.5">
        {score.toFixed(1)}
      </span>
      <span className="text-xs text-muted-foreground">/5</span>
    </div>
  );
}

// ─── Announcements Banner ────────────────────────────────────────────────────

function AnnouncementsBanner({ announcements }: { announcements: Type__15[] }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  const visible = announcements.filter((a) => !dismissedIds.has(a.id));

  if (visible.length === 0) return null;

  const current = visible[Math.min(currentIndex, visible.length - 1)];

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  return (
    <div
      className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4"
      data-ocid="dashboard.announcements"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Megaphone className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Announcement
            </p>
            {visible.length > 1 && (
              <span className="text-xs text-muted-foreground">
                {Math.min(currentIndex + 1, visible.length)} of {visible.length}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground">
            {current.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {current.content}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {visible.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous announcement"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Next announcement"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(visible.length - 1, i + 1))
                }
                disabled={currentIndex >= visible.length - 1}
                className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => dismiss(current.id)}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="dashboard.dismiss_announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Checklist ────────────────────────────────────────────────────

function OnboardingChecklist({
  items,
  onNavigateProfile,
}: {
  items: Type__10[];
  onNavigateProfile: () => void;
}) {
  const completed = items.filter((i) => i.isCompleted).length;
  const progress =
    items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  if (progress === 100) return null;

  return (
    <Card data-ocid="dashboard.onboarding">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Getting Started
          </CardTitle>
          <span className="text-xs text-muted-foreground font-medium">
            {completed}/{items.length} done
          </span>
        </div>
        <Progress value={progress} className="h-1.5 mt-1" />
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <div
              className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.isCompleted
                  ? "bg-success/15 text-success"
                  : "border-2 border-muted-foreground/30"
              }`}
            >
              {item.isCompleted && <CheckCircle2 className="h-3 w-3" />}
            </div>
            <span
              className={`text-xs ${
                item.isCompleted
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {item.title}
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={onNavigateProfile}
          className="text-xs text-accent hover:underline font-medium inline-block mt-1 cursor-pointer"
          data-ocid="dashboard.view_checklist"
        >
          View full checklist →
        </button>
      </CardContent>
    </Card>
  );
}

// ─── Performance Summary ────────────────────────────────────────────────────

function PerformanceSummary({
  score,
  onNavigateProfile,
}: {
  score: number | null;
  onNavigateProfile: () => void;
}) {
  if (score === null) return null;

  return (
    <Card data-ocid="dashboard.performance">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Performance</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <StarRating score={score} />
        <p className="text-xs text-muted-foreground">
          {score >= 4.5
            ? "Outstanding work! Keep it up."
            : score >= 3.5
              ? "Great progress so far."
              : score >= 2.5
                ? "On track — room to grow."
                : "Keep pushing forward!"}
        </p>
        <button
          type="button"
          onClick={onNavigateProfile}
          className="text-xs text-accent hover:underline font-medium inline-block cursor-pointer"
          data-ocid="dashboard.see_all_scores"
        >
          See all scores →
        </button>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function InternDashboard({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { profile } = useAuth();

  const [projects, setProjects] = useState<View[]>([]);
  const [announcements, setAnnouncements] = useState<Type__15[]>([]);
  const [onboarding, setOnboarding] = useState<Type__10[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || !identity) return;
    (async () => {
      setLoading(true);
      try {
        const principal = identity.getPrincipal();
        const [projectData, announcementData, onboardingData, scoreData] =
          await Promise.allSettled([
            actor.getProjectsForIntern(principal),
            actor.getActiveAnnouncements(),
            actor.getOnboardingChecklist(principal),
            actor.getAverageScore(principal),
          ]);
        if (projectData.status === "fulfilled") setProjects(projectData.value);
        if (announcementData.status === "fulfilled")
          setAnnouncements(announcementData.value);
        if (onboardingData.status === "fulfilled")
          setOnboarding(onboardingData.value);
        if (scoreData.status === "fulfilled")
          setAvgScore(scoreData.value ?? null);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [actor, identity]);

  return (
    <div className="p-6 space-y-6">
      {/* Announcements */}
      {!loading && announcements.length > 0 && (
        <AnnouncementsBanner announcements={announcements} />
      )}

      {/* Welcome Banner */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Welcome back, {profile?.name?.split(" ")[0] || "Intern"}!
            </h1>
            <p className="text-muted-foreground text-sm">
              Here's your internship overview
            </p>
          </div>
          <Badge className="bg-success/10 text-success border-success/20 border">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Active
          </Badge>
        </div>
        {profile && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                {profile.email || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned Projects</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {loading ? "..." : projects.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Skills</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {profile.skills?.length || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Widgets row: onboarding + performance */}
      {!loading && (onboarding.length > 0 || avgScore !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {onboarding.length > 0 && (
            <OnboardingChecklist
              items={onboarding}
              onNavigateProfile={() => onNavigate?.("profile")}
            />
          )}
          {avgScore !== null && (
            <PerformanceSummary
              score={avgScore}
              onNavigateProfile={() => onNavigate?.("profile")}
            />
          )}
        </div>
      )}

      {/* Assigned Projects */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-foreground">
          Your Projects
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div
            className="border border-dashed border-border rounded-lg p-10 text-center"
            data-ocid="dashboard.empty_projects"
          >
            <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No projects assigned yet
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <Card
              key={String(project.id)}
              className="shadow-card"
              data-ocid="dashboard.project_card"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
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
                    {project.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {(project.startDate || project.endDate) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.startDate || "?"} → {project.endDate || "?"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      )}
    </div>
  );
}
