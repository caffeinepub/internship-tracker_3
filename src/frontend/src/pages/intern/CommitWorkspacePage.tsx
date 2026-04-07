import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Code2,
  FilePlus,
  FileText,
  GitBranch,
  GitCommit,
  Lock,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Type__6, Type__7, Type__13 } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useAuth } from "../../hooks/useAuth";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "🟨",
    jsx: "🟨",
    ts: "🔷",
    tsx: "🔷",
    py: "🐍",
    html: "🌐",
    css: "🎨",
    json: "📋",
    md: "📝",
    sh: "⚙️",
    txt: "📄",
    svg: "🖼️",
    png: "🖼️",
    jpg: "🖼️",
  };
  return map[ext] ?? "📄";
}

// ─── types ────────────────────────────────────────────────────────────────────

interface LocalFile extends Type__6 {
  isDirty?: boolean;
}

// ─── File Tree ────────────────────────────────────────────────────────────────

function FileTree({
  files,
  selectedPath,
  onSelect,
  onNewFile,
  onDelete,
  branchName,
  isLocked,
}: {
  files: LocalFile[];
  selectedPath: string | null;
  onSelect: (f: LocalFile) => void;
  onNewFile: () => void;
  onDelete: (path: string) => void;
  branchName: string;
  isLocked: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Branch header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1.5 min-w-0">
          <GitBranch className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">
            {branchName}
          </span>
        </div>
        {isLocked ? (
          <Lock className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={onNewFile}
            title="New file"
            data-ocid="workspace.new_file_btn"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Explorer label */}
      <div className="px-3 py-1.5 border-b border-border/50">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Explorer
        </span>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <FilePlus className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No files yet</p>
            {!isLocked && (
              <button
                type="button"
                className="mt-2 text-xs text-accent hover:underline"
                onClick={onNewFile}
              >
                + Add first file
              </button>
            )}
          </div>
        ) : (
          files.map((f) => (
            <button
              type="button"
              key={f.path}
              className={`group w-full flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors text-left ${
                selectedPath === f.path
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-muted text-foreground"
              }`}
              onClick={() => onSelect(f)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(f)}
              data-ocid={`workspace.file.${f.path}`}
            >
              <span className="text-sm flex-shrink-0">
                {getFileIcon(f.name)}
              </span>
              <span className="text-xs font-mono truncate flex-1 min-w-0">
                {f.name}
              </span>
              {f.isDirty && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0"
                  title="Unsaved changes"
                />
              )}
              {confirmDelete === f.path ? (
                <span
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="text-[10px] text-destructive hover:underline"
                    onClick={() => {
                      onDelete(f.path);
                      setConfirmDelete(null);
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="text-[10px] text-muted-foreground hover:underline"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                !isLocked && (
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(f.path);
                    }}
                    title="Delete file"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function CodeEditor({
  file,
  content,
  onChange,
  onSave,
  isLocked,
}: {
  file: LocalFile | null;
  content: string;
  onChange: (v: string) => void;
  onSave: () => void;
  isLocked: boolean;
}) {
  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-code-bg text-muted-foreground gap-3">
        <Code2 className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a file to start editing</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getFileIcon(file.name)}</span>
          <span className="text-sm font-mono text-foreground">{file.path}</span>
          {file.isDirty && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              Modified
            </Badge>
          )}
        </div>
        {!isLocked && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={onSave}
            disabled={!file.isDirty}
            data-ocid="workspace.save_btn"
          >
            <Save className="h-3 w-3" />
            Save
          </Button>
        )}
      </div>

      {/* Textarea editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          className="w-full h-full resize-none bg-code-bg text-foreground font-mono text-sm p-4 focus:outline-none border-0 leading-relaxed"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          readOnly={isLocked}
          spellCheck={false}
          data-ocid="workspace.editor"
          style={{ fontFamily: "JetBrainsMono, ui-monospace, monospace" }}
        />
      </div>
    </div>
  );
}

// ─── Commit Panel ─────────────────────────────────────────────────────────────

function CommitPanel({
  files,
  onPush,
  pushing,
  isLocked,
}: {
  files: LocalFile[];
  onPush: (message: string) => Promise<void>;
  pushing: boolean;
  isLocked: boolean;
}) {
  const [message, setMessage] = useState("");
  const dirtyFiles = files.filter((f) => f.isDirty);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border bg-muted/30 flex-shrink-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Source Control
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLocked && (
          <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 border border-destructive/20">
            <Lock className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive">
              Branch is locked by admin
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Commit message *
          </Label>
          <Textarea
            placeholder="Describe what you changed..."
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLocked}
            className="text-sm resize-none"
            data-ocid="workspace.commit_message"
          />
        </div>

        {/* Changed files */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
            Changes ({dirtyFiles.length})
          </p>
          {dirtyFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No unsaved changes
            </p>
          ) : (
            <div className="space-y-1">
              {dirtyFiles.map((f) => (
                <div key={f.path} className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent font-mono">M</span>
                  <span className="font-mono text-foreground truncate">
                    {f.path}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full gap-2"
          onClick={async () => {
            await onPush(message);
            setMessage("");
          }}
          disabled={
            isLocked || pushing || !message.trim() || dirtyFiles.length === 0
          }
          data-ocid="workspace.push_btn"
        >
          <Upload className="h-4 w-4" />
          {pushing ? "Pushing..." : "Push Commit"}
        </Button>
      </div>
    </div>
  );
}

// ─── Commit History Panel ──────────────────────────────────────────────────────

function CommitHistory({
  commits,
  loading,
}: { commits: Type__7[]; loading: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <GitCommit className="h-8 w-8 opacity-30" />
        <p className="text-sm">No commits yet — push your first commit</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {commits.map((commit) => (
        <div
          key={commit.id}
          className="p-3 hover:bg-muted/30 transition-colors"
        >
          <button
            type="button"
            className="w-full flex items-start justify-between gap-2 cursor-pointer text-left"
            onClick={() =>
              setExpanded(expanded === commit.id ? null : commit.id)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              setExpanded(expanded === commit.id ? null : commit.id)
            }
          >
            <div className="flex items-start gap-2 min-w-0">
              <GitCommit className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground break-words">
                  {commit.message}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {commit.id.slice(0, 7)}
                  {" · "}
                  {commit.files.length} file
                  {commit.files.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {formatTime(commit.timestamp)}
              </span>
              <ChevronRight
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded === commit.id ? "rotate-90" : ""}`}
              />
            </div>
          </button>
          {expanded === commit.id && commit.files.length > 0 && (
            <div className="mt-2 ml-5 space-y-1">
              {commit.files.map((f) => (
                <div
                  key={f.path}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="font-mono truncate">{f.path}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── New File Dialog (inline form) ────────────────────────────────────────────

function NewFileForm({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border-b border-border">
      <FilePlus className="h-3.5 w-3.5 text-accent flex-shrink-0" />
      <Input
        ref={inputRef}
        className="h-6 text-xs font-mono py-0 px-1.5 flex-1"
        placeholder="filename.js"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        type="button"
        className="text-[10px] text-accent hover:underline whitespace-nowrap"
        onClick={() => name.trim() && onConfirm(name.trim())}
      >
        Create
      </button>
      <button
        type="button"
        className="text-[10px] text-muted-foreground hover:underline"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommitWorkspacePage() {
  const { actor } = useActor();
  const { profile } = useAuth();

  const [branch, setBranch] = useState<Type__13 | null>(null);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [commits, setCommits] = useState<Type__7[]>([]);
  const [loadingBranch, setLoadingBranch] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [pushing, setPushing] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");

  const selectedFile = files.find((f) => f.path === selectedPath) ?? null;

  const fetchBranch = useCallback(async () => {
    if (!actor || !profile) return;
    setLoadingBranch(true);
    try {
      const b = await actor.getBranchForIntern(profile.principal);
      setBranch(b ?? null);
      if (b) {
        setLoadingCommits(true);
        const [cs, latestFiles] = await Promise.all([
          actor.getCommitsForBranch(b.id),
          actor.getLatestFiles(b.id),
        ]);
        setCommits(
          [...cs].sort((a, c) => Number(c.timestamp) - Number(a.timestamp)),
        );
        setFiles(latestFiles.map((f) => ({ ...f, isDirty: false })));
        setLoadingCommits(false);
      }
    } catch {
      toast.error("Failed to load workspace");
    } finally {
      setLoadingBranch(false);
    }
  }, [actor, profile]);

  useEffect(() => {
    fetchBranch();
  }, [fetchBranch]);

  // When a file is selected, load its content into the editor
  const handleSelectFile = (f: LocalFile) => {
    // Save editorContent back to the current file before switching
    if (selectedPath) {
      setFiles((prev) =>
        prev.map((file) =>
          file.path === selectedPath
            ? {
                ...file,
                content: editorContent,
                isDirty: file.content !== editorContent,
              }
            : file,
        ),
      );
    }
    setSelectedPath(f.path);
    setEditorContent(f.content);
    setActiveTab("editor");
  };

  // Save editor content back to local file state
  const handleSave = () => {
    if (!selectedPath) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.path === selectedPath
          ? { ...f, content: editorContent, isDirty: true }
          : f,
      ),
    );
    toast.success("File saved locally — push a commit to persist");
  };

  // Track content change to mark dirty
  const handleEditorChange = (v: string) => {
    setEditorContent(v);
  };

  // New file
  const handleNewFile = (name: string) => {
    const path = name.includes("/") ? name : name;
    if (files.some((f) => f.path === path)) {
      toast.error("A file with that name already exists");
      return;
    }
    const newFile: LocalFile = { name, path, content: "", isDirty: true };
    setFiles((prev) => [...prev, newFile]);
    setSelectedPath(path);
    setEditorContent("");
    setShowNewFile(false);
    setActiveTab("editor");
  };

  // Delete file
  const handleDelete = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path));
    if (selectedPath === path) {
      setSelectedPath(null);
      setEditorContent("");
    }
    toast.success("File removed — push a commit to persist");
  };

  // Push commit
  const handlePush = async (message: string) => {
    if (!actor || !branch) return;
    setPushing(true);
    try {
      // Save current editor content before pushing
      let finalFiles = files;
      if (selectedPath) {
        finalFiles = files.map((f) =>
          f.path === selectedPath
            ? { ...f, content: editorContent, isDirty: true }
            : f,
        );
        setFiles(finalFiles);
      }

      const dirtyFiles = finalFiles
        .filter((f) => f.isDirty)
        .map(({ name, path, content }) => ({ name, path, content }));
      if (dirtyFiles.length === 0) {
        toast.error("No changed files to commit");
        setPushing(false);
        return;
      }

      const newCommit = await actor.pushCommit(branch.id, message, dirtyFiles);
      setCommits((prev) => [newCommit, ...prev]);
      // Mark all files as clean
      setFiles((prev) => prev.map((f) => ({ ...f, isDirty: false })));
      toast.success("Commit pushed successfully!");
    } catch {
      toast.error("Failed to push commit");
    } finally {
      setPushing(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loadingBranch) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  // ── No branch assigned ──────────────────────────────────────────────────────
  if (!branch) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              No branch assigned yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Contact your admin to get a project branch assigned to you
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Mobile layout (tabs) ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Page header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="h-5 w-5 text-accent flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold text-foreground leading-tight">
              Code Workspace
            </h1>
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {branch.name}
              </span>
              {branch.isLocked && (
                <Badge
                  variant="destructive"
                  className="text-[10px] px-1 py-0 h-4"
                >
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{commits.length} commits</span>
        </div>
      </div>

      {/* ── Mobile: tab layout ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col md:hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="flex-shrink-0 rounded-none border-b border-border bg-card justify-start h-9 px-2 gap-1">
            <TabsTrigger value="files" className="text-xs h-7">
              Files
            </TabsTrigger>
            <TabsTrigger value="editor" className="text-xs h-7">
              Editor
            </TabsTrigger>
            <TabsTrigger value="commit" className="text-xs h-7">
              Commit
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs h-7">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="files"
            className="flex-1 overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            {showNewFile && (
              <NewFileForm
                onConfirm={handleNewFile}
                onCancel={() => setShowNewFile(false)}
              />
            )}
            <FileTree
              files={files}
              selectedPath={selectedPath}
              onSelect={handleSelectFile}
              onNewFile={() => setShowNewFile(true)}
              onDelete={handleDelete}
              branchName={branch.name}
              isLocked={branch.isLocked}
            />
          </TabsContent>

          <TabsContent
            value="editor"
            className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <CodeEditor
              file={selectedFile}
              content={editorContent}
              onChange={handleEditorChange}
              onSave={handleSave}
              isLocked={branch.isLocked}
            />
          </TabsContent>

          <TabsContent value="commit" className="flex-1 overflow-y-auto m-0">
            <CommitPanel
              files={files}
              onPush={handlePush}
              pushing={pushing}
              isLocked={branch.isLocked}
            />
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
            <CommitHistory commits={commits} loading={loadingCommits} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Desktop: 3-panel layout ─────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left: File tree */}
        <div className="w-60 flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-card/50">
          {showNewFile && (
            <NewFileForm
              onConfirm={handleNewFile}
              onCancel={() => setShowNewFile(false)}
            />
          )}
          <FileTree
            files={files}
            selectedPath={selectedPath}
            onSelect={handleSelectFile}
            onNewFile={() => setShowNewFile(true)}
            onDelete={handleDelete}
            branchName={branch.name}
            isLocked={branch.isLocked}
          />
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CodeEditor
            file={selectedFile}
            content={editorContent}
            onChange={handleEditorChange}
            onSave={handleSave}
            isLocked={branch.isLocked}
          />
        </div>

        {/* Right: Commit + History (tabs) */}
        <div className="w-72 flex-shrink-0 border-l border-border flex flex-col overflow-hidden bg-card/30">
          <Tabs
            defaultValue="commit"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="flex-shrink-0 rounded-none border-b border-border bg-card justify-start h-9 px-2 gap-1">
              <TabsTrigger value="commit" className="text-xs h-7">
                Commit
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs h-7">
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="commit" className="flex-1 overflow-y-auto m-0">
              <CommitPanel
                files={files}
                onPush={handlePush}
                pushing={pushing}
                isLocked={branch.isLocked}
              />
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
              <CommitHistory commits={commits} loading={loadingCommits} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
