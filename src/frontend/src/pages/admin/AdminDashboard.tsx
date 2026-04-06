import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Clock, FolderKanban, Users } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { View__1 } from "../../backend";
import { useActor } from "../../hooks/useActor";

export default function AdminDashboard() {
  const { actor } = useActor();
  const [stats, setStats] = useState({
    activeInterns: 0,
    pendingApprovals: 0,
    totalProjects: 0,
    activeProjects: 0,
  });
  const [pending, setPending] = useState<View__1[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [activeInterns, pendingInterns, projects] = await Promise.all([
        actor.getAllInterns(),
        actor.getAllPendingInterns(),
        actor.getAllProjects(),
      ]);
      setStats({
        activeInterns: activeInterns.length,
        pendingApprovals: pendingInterns.length,
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === "active").length,
      });
      setPending(pendingInterns.slice(0, 5));
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = [
    {
      label: "Active Interns",
      value: stats.activeInterns,
      icon: Users,
      color: "text-accent",
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: Clock,
      color: "text-warning",
    },
    {
      label: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "text-chart-1",
    },
    {
      label: "Active Projects",
      value: stats.activeProjects,
      icon: Activity,
      color: "text-success",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back, Admin
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-display font-bold text-foreground">
                      {s.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {s.label}
                    </p>
                  </div>
                  <s.icon className={`h-5 w-5 ${s.color} mt-1`} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Approvals */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">
            Recent Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No pending approvals
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((intern) => (
                  <TableRow key={intern.email}>
                    <TableCell className="font-medium">{intern.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {intern.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-warning/10 text-warning border-warning/20 text-xs"
                      >
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground">
                        Go to Interns page
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
