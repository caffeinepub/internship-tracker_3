import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Search, ShieldCheck, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { View__1 } from "../../backend";
import { useActor } from "../../hooks/useActor";

type InternWithKey = View__1 & { key: string };

function statusBadge(status: string) {
  if (status === "active")
    return (
      <Badge className="bg-success/10 text-success border-success/20 border text-xs">
        Active
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge className="bg-warning/10 text-warning border-warning/20 border text-xs">
        Pending
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 border text-xs">
        Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs">
      {status}
    </Badge>
  );
}

function InternTable({
  interns,
  loading,
  onApprove,
  onReject,
  onPromote,
  actionLoading,
  searchQuery,
}: {
  interns: InternWithKey[];
  loading: boolean;
  onApprove?: (_key: string) => void;
  onReject?: (_key: string) => void;
  onPromote?: (_key: string) => void;
  actionLoading: string | null;
  searchQuery: string;
}) {
  const filtered = interns.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground text-sm">
        No interns found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Bio</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((intern) => (
            <TableRow key={intern.key}>
              <TableCell className="font-medium">{intern.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {intern.email}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">
                {intern.bio || "—"}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {intern.skills.length > 0 ? (
                    intern.skills.slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {intern.skills.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{intern.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {statusBadge(intern.registrationStatus as string)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {onApprove && intern.registrationStatus !== "active" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-success hover:text-success hover:bg-success/10"
                      onClick={() => onApprove(intern.key)}
                      disabled={actionLoading === intern.key}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                  )}
                  {onReject && intern.registrationStatus !== "rejected" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onReject(intern.key)}
                      disabled={actionLoading === intern.key}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  )}
                  {onPromote && intern.registrationStatus === "active" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs hover:bg-accent/10"
                      onClick={() => onPromote(intern.key)}
                      disabled={actionLoading === intern.key}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Make Admin
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function InternsPage() {
  const { actor } = useActor();
  const [allInterns, setAllInterns] = useState<InternWithKey[]>([]);
  const [pendingInterns, setPendingInterns] = useState<InternWithKey[]>([]);
  const [activeInterns, setActiveInterns] = useState<InternWithKey[]>([]);
  const [rejectedInterns, setRejectedInterns] = useState<InternWithKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [all, pending, active, rejected] = await Promise.all([
        actor.getAllUsers(),
        actor.getAllPendingInterns(),
        actor.getAllInterns(),
        actor.getAllRejectedInterns(),
      ]);
      const makeKeyed = (list: View__1[]): InternWithKey[] =>
        list.map((i, idx) => ({ ...i, key: `${i.email}-${idx}` }));
      setAllInterns(makeKeyed(all));
      setPendingInterns(makeKeyed(pending));
      setActiveInterns(makeKeyed(active));
      setRejectedInterns(makeKeyed(rejected));
    } catch {
      toast.error("Failed to load interns");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (_key: string) => {
    toast.info(
      "Approve action requires Principal lookup — not available in this view. Coming in a future phase.",
    );
  };

  const handleReject = async (_key: string) => {
    toast.info(
      "Reject action requires Principal lookup — not available in this view. Coming in a future phase.",
    );
  };

  const handlePromote = async (_key: string) => {
    toast.info(
      "Promote action requires Principal lookup — not available in this view. Coming in a future phase.",
    );
  };

  const tableProps = {
    loading,
    actionLoading,
    searchQuery: search,
    onApprove: handleApprove,
    onReject: handleReject,
    onPromote: handlePromote,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Interns
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage intern registrations and profiles
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {!loading && pendingInterns.length > 0 && (
              <Badge className="ml-1.5 h-4 w-4 p-0 text-xs flex items-center justify-center bg-warning/20 text-warning border-0">
                {pendingInterns.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <div className="mt-4 border border-border rounded-lg overflow-hidden bg-card">
          <TabsContent value="pending" className="m-0">
            <InternTable interns={pendingInterns} {...tableProps} />
          </TabsContent>
          <TabsContent value="active" className="m-0">
            <InternTable interns={activeInterns} {...tableProps} />
          </TabsContent>
          <TabsContent value="rejected" className="m-0">
            <InternTable interns={rejectedInterns} {...tableProps} />
          </TabsContent>
          <TabsContent value="all" className="m-0">
            <InternTable interns={allInterns} {...tableProps} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
