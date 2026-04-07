import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  GitBranch,
  GitCommit,
  Lock,
  Search,
  Unlock,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Type__6, Type__7, Type__13 } from "../../backend";
import { useActor } from "../../hooks/useActor";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(ts: bigint) {
  const ms = Date.now() - Number(ts) / 1_000_000;
  const mins = Math.floor(ms / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

// ─── Simple line-by-line diff algorithm ───────────────────────────────────────

type DiffLine = {
  type: "added" | "removed" | "context";
  content: string;
  lineNum?: number;
};

function computeDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent === "" ? [] : oldContent.split("\n");
  const newLines = newContent === "" ? [] : newContent.split("\n");
  const result: DiffLine[] = [];

  // LCS-based patience diff (simplified two-pointer approach)
  let oi = 0;
  let ni = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    const oldLine = oldLines[oi];
    const newLine = newLines[ni];

    if (oi >= oldLines.length) {
      result.push({ type: "added", content: newLines[ni], lineNum: ni + 1 });
      ni++;
    } else if (ni >= newLines.length) {
      result.push({ type: "removed", content: oldLines[oi] });
      oi++;
    } else if (oldLine === newLine) {
      result.push({ type: "context", content: newLine, lineNum: ni + 1 });
      oi++;
      ni++;
    } else {
      // Look ahead for matching line within small window
      const window = 4;
      let matched = false;

      for (let look = 1; look <= window && !matched; look++) {
        if (ni + look < newLines.length && oldLine === newLines[ni + look]) {
          // old line will be found in new — emit new lines as added
          for (let k = 0; k < look; k++) {
            result.push({
              type: "added",
              content: newLines[ni + k],
              lineNum: ni + k + 1,
            });
          }
          ni += look;
          matched = true;
        } else if (
          oi + look < oldLines.length &&
          newLine === oldLines[oi + look]
        ) {
          // new line will be found in old — emit old lines as removed
          for (let k = 0; k < look; k++) {
            result.push({ type: "removed", content: oldLines[oi + k] });
          }
          oi += look;
          matched = true;
        }
      }

      if (!matched) {
        result.push({ type: "removed", content: oldLine });
        result.push({ type: "added", content: newLine, lineNum: ni + 1 });
        oi++;
        ni++;
      }
    }
  }

  return result;
}

// ─── Diff Viewer ─────────────────────────────────────────────────────────────

function FileDiff({
  filename,
  oldContent,
  newContent,
}: { filename: string; oldContent: string; newContent: string }) {
  const lines = useMemo(
    () => computeDiff(oldContent, newContent),
    [oldContent, newContent],
  );
  const added = lines.filter((l) => l.type === "added").length;
  const removed = lines.filter((l) => l.type === "removed").length;

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-4">
      {/* File header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-mono text-foreground truncate">
            {filename}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
          {added > 0 && (
            <span className="text-diff-addition font-semibold">+{added}</span>
          )}
          {removed > 0 && (
            <span className="text-diff-deletion font-semibold">-{removed}</span>
          )}
        </div>
      </div>

      {/* Diff lines */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr
                key={`${line.type}-${idx}`}
                className={
                  line.type === "added"
                    ? "diff-line-added"
                    : line.type === "removed"
                      ? "diff-line-removed"
                      : "diff-line-context"
                }
              >
                <td className="w-10 text-right pr-3 select-none opacity-50 py-px px-2">
                  {line.lineNum ?? ""}
                </td>
                <td className="w-4 select-none py-px">
                  {line.type === "added"
                    ? "+"
                    : line.type === "removed"
                      ? "−"
                      : " "}
                </td>
                <td className="py-px pr-4 whitespace-pre-wrap break-all">
                  {line.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lines.length === 0 && (
          <p className="text-xs text-muted-foreground px-4 py-3 italic">
            No changes
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Commit Diff View ─────────────────────────────────────────────────────────

function CommitDiffView({
  commit,
  parentCommit,
  onBack,
}: {
  commit: Type__7;
  parentCommit: Type__7 | null;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card/80">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs mb-2 -ml-1"
          onClick={onBack}
          data-ocid="code-monitor.diff.back_btn"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to commits
        </Button>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <GitCommit className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground break-words">
                {commit.message}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {commit.id.slice(0, 7)}
                {commit.parentCommitId && (
                  <span className="ml-1 opacity-60">
                    ← {commit.parentCommitId.slice(0, 7)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-muted-foreground">
              {formatDate(commit.timestamp)}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {commit.authorId.toString().slice(0, 12)}…
            </p>
          </div>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-y-auto p-4">
        {commit.files.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No files in this commit</p>
          </div>
        ) : (
          commit.files.map((file) => {
            const parentFile = parentCommit?.files.find(
              (f) => f.path === file.path,
            );
            return (
              <FileDiff
                key={file.path}
                filename={file.path}
                oldContent={parentFile?.content ?? ""}
                newContent={file.content}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Commit List ─────────────────────────────────────────────────────────────

function CommitListView({
  commits,
  loading,
  branchName,
  onSelect,
}: {
  commits: Type__7[];
  loading: boolean;
  branchName: string;
  onSelect: (commit: Type__7) => void;
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">
              {branchName}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {commits.length} commit{commits.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {commits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <GitCommit className="h-8 w-8 opacity-30" />
            <p className="text-sm">No commits pushed yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {commits.map((commit, idx) => (
              <button
                type="button"
                key={commit.id}
                className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start justify-between gap-2 group"
                onClick={() => onSelect(commit)}
                data-ocid={`code-monitor.commit.${idx + 1}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <GitCommit className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground break-words">
                      {commit.message}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {commit.id.slice(0, 7)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ·
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        {commit.authorId.toString().slice(0, 10)}…
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ·
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {commit.files.length} file
                        {commit.files.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatRelative(commit.timestamp)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Branch Card ─────────────────────────────────────────────────────────────

function BranchCard({
  branch,
  isSelected,
  onSelect,
  onToggleLock,
  toggling,
  lastCommitTime,
}: {
  branch: Type__13;
  isSelected: boolean;
  onSelect: () => void;
  onToggleLock: () => void;
  toggling: boolean;
  lastCommitTime?: bigint;
}) {
  return (
    <button
      type="button"
      className={`w-full text-left cursor-pointer border rounded-lg px-3 py-2.5 transition-all ${
        isSelected
          ? "border-accent bg-accent/5"
          : "border-border hover:border-accent/40 hover:bg-muted/30"
      }`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      data-ocid={`code-monitor.branch.${branch.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch
            className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? "text-accent" : "text-muted-foreground"}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {branch.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Project: {branch.projectId.slice(0, 12)}
              {lastCommitTime && <> · {formatRelative(lastCommitTime)}</>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {branch.isLocked && (
            <Badge
              variant="destructive"
              className="text-[10px] px-1.5 py-0 h-4"
            >
              Locked
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            disabled={toggling}
            title={branch.isLocked ? "Unlock branch" : "Lock branch"}
            data-ocid={`code-monitor.toggle_lock.${branch.id}`}
          >
            {branch.isLocked ? (
              <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCodeMonitorPage() {
  const { actor } = useActor();

  const [branches, setBranches] = useState<Type__13[]>([]);
  const [commits, setCommits] = useState<Type__7[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Type__7 | null>(null);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [togglingLock, setTogglingLock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBranches = useCallback(async () => {
    if (!actor) return;
    setLoadingBranches(true);
    try {
      const data = await actor.getAllBranches();
      setBranches(data);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoadingBranches(false);
    }
  }, [actor]);

  const fetchCommits = useCallback(
    async (branchId: string) => {
      if (!actor) return;
      setLoadingCommits(true);
      setSelectedCommit(null);
      try {
        const data = await actor.getCommitsForBranch(branchId);
        setCommits(
          [...data].sort((a, b) => Number(b.timestamp) - Number(a.timestamp)),
        );
      } catch {
        toast.error("Failed to load commits");
      } finally {
        setLoadingCommits(false);
      }
    },
    [actor],
  );

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    fetchCommits(branchId);
  };

  const handleToggleLock = async (branchId: string) => {
    if (!actor) return;
    setTogglingLock(branchId);
    try {
      await actor.toggleBranchLock(branchId);
      setBranches((prev) =>
        prev.map((b) =>
          b.id === branchId ? { ...b, isLocked: !b.isLocked } : b,
        ),
      );
      toast.success("Branch lock updated");
    } catch {
      toast.error("Failed to toggle lock");
    } finally {
      setTogglingLock(null);
    }
  };

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const filteredBranches = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.projectId.toLowerCase().includes(q),
    );
  }, [branches, searchQuery]);

  // Find parent commit for diff
  const parentCommit = selectedCommit
    ? (commits.find((c) => c.id === selectedCommit.parentCommitId) ?? null)
    : null;

  // Stats summary
  const lockedCount = branches.filter((b) => b.isLocked).length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Page header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Code Monitor
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor all intern branches and commit activity
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
              <GitBranch className="h-3.5 w-3.5" />
              <span>{branches.length} branches</span>
            </div>
            {lockedCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-md">
                <Lock className="h-3.5 w-3.5" />
                <span>{lockedCount} locked</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Branch list */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-card/30">
          {/* Search */}
          <div className="flex-shrink-0 p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-ocid="code-monitor.search"
              />
            </div>
          </div>

          {/* Branch list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingBranches ? (
              [1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : filteredBranches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <GitBranch className="h-8 w-8 opacity-30" />
                <p className="text-sm text-center">
                  {searchQuery
                    ? "No branches match your search"
                    : "No branches created yet"}
                </p>
              </div>
            ) : (
              filteredBranches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  isSelected={selectedBranchId === branch.id}
                  onSelect={() => handleSelectBranch(branch.id)}
                  onToggleLock={() => handleToggleLock(branch.id)}
                  toggling={togglingLock === branch.id}
                  lastCommitTime={
                    selectedBranchId === branch.id && commits.length > 0
                      ? commits[0].timestamp
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Commit list or diff viewer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!selectedBranchId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <GitBranch className="h-8 w-8 opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Select a branch
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click a branch on the left to view its commit history
                </p>
              </div>
            </div>
          ) : selectedCommit ? (
            <CommitDiffView
              commit={selectedCommit}
              parentCommit={parentCommit}
              onBack={() => setSelectedCommit(null)}
            />
          ) : (
            <CommitListView
              commits={commits}
              loading={loadingCommits}
              branchName={selectedBranch?.name ?? ""}
              onSelect={setSelectedCommit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
