import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  View__2 as InternProfile,
  View as ProjectView,
  backendInterface,
} from "../../backend";
import { useActor } from "../../hooks/useActor";

interface ExtensionRequest {
  id: bigint;
  projectId: bigint;
  internPrincipal: Principal;
  reason: string;
  requestedEndDate: string;
  status: string;
  adminNote: string | null;
  createdAt: bigint;
}

interface ExtensionActor {
  getAllExtensionRequests(): Promise<ExtensionRequest[]>;
  getAllProjects(): Promise<ProjectView[]>;
  getAllInterns(): Promise<InternProfile[]>;
  respondToExtensionRequest(
    requestId: bigint,
    approved: boolean,
    adminNote: string | null,
  ): Promise<void>;
}

function ExtensionStatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge className="bg-success/10 text-success border border-success/20 text-xs">
        Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-destructive/10 text-destructive border border-destructive/20 text-xs">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning/10 text-warning border border-warning/20 text-xs">
      Pending
    </Badge>
  );
}

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ExtensionRequestsPage() {
  const { actor } = useActor();
  const ext = actor as ExtensionActor | null;

  const [requests, setRequests] = useState<ExtensionRequest[]>([]);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [interns, setInterns] = useState<InternProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<bigint | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Approve loading state
  const [approvingId, setApprovingId] = useState<bigint | null>(null);

  const fetchData = useCallback(async () => {
    if (!ext) return;
    setLoading(true);
    try {
      const [requestsData, projectsData, internsData] = await Promise.all([
        ext.getAllExtensionRequests(),
        ext.getAllProjects(),
        ext.getAllInterns(),
      ]);
      setRequests(requestsData);
      setProjects(projectsData);
      setInterns(internsData);
    } catch {
      toast.error("Failed to load extension requests");
    } finally {
      setLoading(false);
    }
  }, [ext]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const projectMap = new Map<string, string>(
    projects.map((p) => [String(p.id), p.title]),
  );

  const internMap = new Map<string, string>(
    interns.map((i) => [i.principal.toString(), i.name]),
  );

  const sorted = [...requests].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  const handleApprove = async (requestId: bigint) => {
    if (!ext) return;
    setApprovingId(requestId);
    try {
      await ext.respondToExtensionRequest(requestId, true, null);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "approved" } : r,
        ),
      );
      toast.success("Extension request approved");
    } catch {
      toast.error("Failed to approve request");
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectDialog = (requestId: bigint) => {
    setRejectTargetId(requestId);
    setRejectNote("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!ext || rejectTargetId === null) return;
    setSubmittingReject(true);
    try {
      await ext.respondToExtensionRequest(
        rejectTargetId,
        false,
        rejectNote.trim() || null,
      );
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectTargetId
            ? { ...r, status: "rejected", adminNote: rejectNote.trim() || null }
            : r,
        ),
      );
      toast.success("Extension request rejected");
      setRejectDialogOpen(false);
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setSubmittingReject(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="p-6 space-y-6" data-ocid="extensions.page">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-accent" />
            Extension Requests
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Review and respond to intern project extension requests
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          data-ocid="extensions.secondary_button"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      {!loading && requests.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-warning/5 rounded-lg border border-warning/20 p-3 text-center">
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </div>
          <div className="bg-success/5 rounded-lg border border-success/20 p-3 text-center">
            <p className="text-2xl font-bold text-success">{approvedCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Approved</p>
          </div>
          <div className="bg-destructive/5 rounded-lg border border-destructive/20 p-3 text-center">
            <p className="text-2xl font-bold text-destructive">
              {rejectedCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Rejected</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2" data-ocid="extensions.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="border border-dashed border-border rounded-lg p-12 text-center"
          data-ocid="extensions.empty_state"
        >
          <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No extension requests yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Requests will appear here when interns submit them from their
            projects
          </p>
        </div>
      ) : (
        <div
          className="border border-border rounded-lg overflow-hidden"
          data-ocid="extensions.table"
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
                  Reason
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Requested End Date
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Submitted
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((req, idx) => (
                <TableRow
                  key={String(req.id)}
                  data-ocid={`extensions.row.${idx + 1}`}
                >
                  <TableCell className="font-medium text-sm">
                    {internMap.get(req.internPrincipal.toString()) || (
                      <span className="font-mono text-xs text-muted-foreground">
                        {req.internPrincipal.toString().slice(0, 12)}...
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {projectMap.get(String(req.projectId)) ||
                      `Project #${req.projectId}`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                    <span className="truncate block" title={req.reason}>
                      {req.reason}
                    </span>
                    {req.adminNote && (
                      <span className="block text-xs text-muted-foreground/70 mt-0.5 italic">
                        Note: {req.adminNote}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.requestedEndDate}
                  </TableCell>
                  <TableCell>
                    <ExtensionStatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(req.createdAt)}
                  </TableCell>
                  <TableCell>
                    {req.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-success border-success/30 hover:bg-success/10 hover:text-success"
                          onClick={() => handleApprove(req.id)}
                          disabled={approvingId === req.id}
                          data-ocid={`extensions.confirm_button.${idx + 1}`}
                        >
                          {approvingId === req.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => openRejectDialog(req.id)}
                          data-ocid={`extensions.delete_button.${idx + 1}`}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">
                        —
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {requests.length} total request{requests.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="extensions.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Reject Extension Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Optionally include a note explaining the rejection decision.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reject-note" className="text-xs font-medium">
                Admin Note (optional)
              </Label>
              <Textarea
                id="reject-note"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Project timeline cannot be extended at this time..."
                className="min-h-[80px] text-sm resize-none"
                data-ocid="extensions.textarea"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={submittingReject}
              data-ocid="extensions.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={submittingReject}
              data-ocid="extensions.confirm_button"
            >
              {submittingReject ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {submittingReject ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
