import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import { Loader2, Plus, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Type__9 } from "../backend";
import { useActor } from "../hooks/useActor";

const CATEGORIES = [
  "Code Quality",
  "Communication",
  "Punctuality",
  "Initiative",
  "Overall",
];

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" data-ocid="score_card.star_selector">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              n <= (hovered || value)
                ? "fill-warning text-warning"
                : "fill-none text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function AverageStars({ avg }: { avg: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${
            n <= Math.round(avg)
              ? "fill-warning text-warning"
              : "fill-none text-muted-foreground"
          }`}
        />
      ))}
      <span className="text-sm text-muted-foreground ml-1">
        {avg.toFixed(1)}
      </span>
    </div>
  );
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PerformanceScoreCard({
  internId,
  internName,
}: {
  internId: Principal;
  internName: string;
}) {
  const { actor } = useActor();
  const [scores, setScores] = useState<Type__9[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        actor.getScoresForIntern(internId),
        actor.getAverageScore(internId),
      ]);
      setScores(
        [...s].sort((x, y) => Number(y.timestamp) - Number(x.timestamp)),
      );
      setAvg(a ?? null);
    } catch {
      toast.error("Failed to load scores");
    } finally {
      setLoading(false);
    }
  }, [actor, internId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!actor || rating === 0) return;
    setSubmitting(true);
    try {
      await actor.addPerformanceScore(
        internId,
        BigInt(rating),
        feedback.trim(),
        category,
      );
      toast.success("Score added");
      setShowForm(false);
      setRating(0);
      setFeedback("");
      setCategory(CATEGORIES[0]);
      await load();
    } catch {
      toast.error("Failed to add score");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm" data-ocid="score_card.container">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {internName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-semibold">
                {internName}
              </CardTitle>
              {avg !== null && <AverageStars avg={avg} />}
              {avg === null && !loading && (
                <p className="text-xs text-muted-foreground">No scores yet</p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm((v) => !v)}
            className="gap-1 text-xs"
            data-ocid="score_card.add_score_button"
          >
            <Plus className="h-3 w-3" />
            Add Score
          </Button>
        </div>
      </CardHeader>

      {showForm && (
        <CardContent className="pt-0 pb-4">
          <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-ocid="score_card.category_select"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rating</Label>
                <StarSelector value={rating} onChange={setRating} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Feedback (optional)</Label>
              <Textarea
                placeholder="Write your feedback..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                className="resize-none text-sm"
                data-ocid="score_card.feedback_input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                data-ocid="score_card.submit_button"
              >
                {submitting && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                )}
                Submit Score
              </Button>
            </div>
          </div>
        </CardContent>
      )}

      {loading ? (
        <CardContent className="pt-0 pb-4">
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      ) : scores.length > 0 ? (
        <CardContent className="pt-0 pb-4">
          <Separator className="mb-3" />
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {scores.map((s) => (
              <div
                key={`${String(s.timestamp)}-${s.category}`}
                className="flex items-start gap-3 text-xs p-2 rounded-md bg-background border border-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {s.category}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatTimestamp(s.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3 w-3 ${
                          n <= Number(s.score)
                            ? "fill-warning text-warning"
                            : "fill-none text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  {s.feedback && (
                    <p className="text-muted-foreground mt-0.5 truncate">
                      {s.feedback}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
