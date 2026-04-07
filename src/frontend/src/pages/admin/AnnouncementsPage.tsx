import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Type__15 } from "../../backend";
import { useActor } from "../../hooks/useActor";

function formatTime(ts: bigint) {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AnnouncementCard({
  ann,
  idx,
  onDeactivate,
  deactivating,
}: {
  ann: Type__15;
  idx: number;
  onDeactivate: (id: string) => void;
  deactivating: string | null;
}) {
  return (
    <Card
      className={`transition-all duration-200 ${!ann.isActive ? "opacity-60" : "hover:shadow-sm"}`}
      data-ocid={`announcements.item.${idx + 1}`}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
              ann.isActive ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <Megaphone
              className={`h-4 w-4 ${ann.isActive ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p
                    className={`text-sm font-semibold ${ann.isActive ? "text-foreground" : "text-muted-foreground line-through"}`}
                  >
                    {ann.title}
                  </p>
                  <Badge
                    variant={ann.isActive ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0 shrink-0"
                  >
                    {ann.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ann.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatTime(ann.timestamp)}
                </p>
              </div>
              {ann.isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => onDeactivate(ann.id)}
                  disabled={deactivating === ann.id}
                  title="Deactivate announcement"
                  data-ocid={`announcements.deactivate.${idx + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnnouncementsPage() {
  const { actor } = useActor();
  const [announcements, setAnnouncements] = useState<Type__15[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await actor.getAllAnnouncements();
      setAnnouncements(
        [...data].sort((a, b) => Number(b.timestamp) - Number(a.timestamp)),
      );
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async () => {
    if (!actor || !title.trim() || !content.trim()) return;
    setCreating(true);
    try {
      const created = await actor.createAnnouncement(
        title.trim(),
        content.trim(),
      );
      setAnnouncements((prev) => [created, ...prev]);
      setCreateOpen(false);
      setTitle("");
      setContent("");
      toast.success("Announcement published");
    } catch {
      toast.error("Failed to create announcement");
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!actor) return;
    setDeactivating(id);
    try {
      await actor.deactivateAnnouncement(id);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: false } : a)),
      );
      toast.success("Announcement deactivated");
    } catch {
      toast.error("Failed to deactivate");
    } finally {
      setDeactivating(null);
    }
  };

  const activeAnnouncements = announcements.filter((a) => a.isActive);
  const inactiveAnnouncements = announcements.filter((a) => !a.isActive);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Broadcast messages to all interns
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 shrink-0"
          data-ocid="announcements.create_button"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {!loading && announcements.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-success">
              {activeAnnouncements.length} active
            </span>
          </div>
          {inactiveAnnouncements.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {inactiveAnnouncements.length} inactive
              </span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card data-ocid="announcements.empty_state">
          <CardContent className="py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No announcements yet
            </h3>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
              Create your first announcement to broadcast a message to all
              interns.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(true)}
              data-ocid="announcements.empty_cta"
            >
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeAnnouncements.map((ann, idx) => (
            <AnnouncementCard
              key={ann.id}
              ann={ann}
              idx={idx}
              onDeactivate={handleDeactivate}
              deactivating={deactivating}
            />
          ))}
          {inactiveAnnouncements.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Inactive
                </span>
                <div className="flex-1 border-t border-border" />
              </div>
              {inactiveAnnouncements.map((ann, idx) => (
                <AnnouncementCard
                  key={ann.id}
                  ann={ann}
                  idx={activeAnnouncements.length + idx}
                  onDeactivate={handleDeactivate}
                  deactivating={deactivating}
                />
              ))}
            </>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent data-ocid="announcements.create_modal">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              New Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ann-title"
                placeholder="e.g. Important deadline update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-ocid="announcements.title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-content">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="ann-content"
                placeholder="Write your announcement here..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none"
                data-ocid="announcements.content_input"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This will be visible to all active interns immediately.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !content.trim()}
                data-ocid="announcements.submit_button"
              >
                {creating ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
