import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  CheckCircle2,
  Circle,
  Edit3,
  Github,
  Globe,
  Link2,
  Linkedin,
  Loader2,
  Plus,
  Save,
  Star,
  Twitter,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Type__9, Type__10, View__2 } from "../../backend";
import { useActor } from "../../hooks/useActor";

function StarDisplay({ avg }: { avg: number }) {
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
      <span className="text-sm font-semibold text-foreground ml-1">
        {avg.toFixed(1)}
      </span>
    </div>
  );
}

function calcCompletion(form: {
  name: string;
  bio: string;
  skills: string[];
  photoUrl: string;
  github: string;
  linkedin: string;
  portfolio: string;
}): number {
  const checks = [
    !!form.name.trim(),
    !!form.bio.trim(),
    form.skills.length > 0,
    !!form.photoUrl,
    !!form.github.trim() || !!form.linkedin.trim() || !!form.portfolio.trim(),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

const SKILL_COLORS = [
  "bg-accent/10 text-accent border-accent/20",
  "bg-warning/10 text-warning border-warning/20",
  "bg-success/10 text-success border-success/20",
  "bg-primary/10 text-primary border-primary/20",
  "bg-chart-4/10 text-chart-4 border-chart-4/20",
];

export default function InternProfilePage() {
  const { actor } = useActor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [scores, setScores] = useState<Type__9[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [checklist, setChecklist] = useState<Type__10[]>([]);
  const [completingItem, setCompletingItem] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [rawProfile, setRawProfile] = useState<View__2 | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    skills: [] as string[],
    photoUrl: "",
    github: "",
    linkedin: "",
    portfolio: "",
    twitter: "",
  });

  const load = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const profile = await actor.getCallerUserProfile();
      if (profile) {
        setRawProfile(profile);
        const links = profile.links ?? [];
        setForm({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          skills: [...profile.skills],
          photoUrl: profile.photoUrl ?? "",
          github: links[0] ?? "",
          linkedin: links[1] ?? "",
          portfolio: links[2] ?? "",
          twitter: links[3] ?? "",
        });
        const principal = profile.principal;
        const [s, a, c] = await Promise.all([
          actor.getScoresForIntern(principal),
          actor.getAverageScore(principal),
          actor.getOnboardingChecklist(principal),
        ]);
        setScores(
          [...s].sort((x, y) => Number(y.timestamp) - Number(x.timestamp)),
        );
        setAvg(a ?? null);
        setChecklist(c);
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((f) => ({ ...f, photoUrl: reader.result as string }));
        setPhotoUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image");
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to process image");
      setPhotoUploading(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills: f.skills.filter((sk) => sk !== skill) }));
  };

  const handleSave = async () => {
    if (!actor || !rawProfile) return;
    setSaving(true);
    try {
      await actor.saveCallerUserProfile({
        ...rawProfile,
        name: form.name,
        bio: form.bio,
        skills: form.skills,
        photoUrl: form.photoUrl || undefined,
        links: [
          form.github,
          form.linkedin,
          form.portfolio,
          form.twitter,
        ].filter(Boolean),
      });
      toast.success("Profile saved!");
      setEditMode(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteItem = async (itemId: string) => {
    if (!actor) return;
    setCompletingItem(itemId);
    try {
      await actor.completeOnboardingItem(itemId);
      setChecklist((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isCompleted: true } : item,
        ),
      );
      toast.success("Item completed!");
    } catch {
      toast.error("Failed to update checklist");
    } finally {
      setCompletingItem(null);
    }
  };

  const completion = calcCompletion(form);
  const completedChecklist = checklist.filter((i) => i.isCompleted).length;
  const checklistProgress =
    checklist.length > 0
      ? Math.round((completedChecklist / checklist.length) * 100)
      : 0;

  const initials = form.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="p-6 max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            My Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your professional resume — visible to admins
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5"
                data-ocid="profile.save_button"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
              className="gap-1.5"
              data-ocid="profile.edit_button"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Overview Card */}
        <Card className="shadow-sm h-fit">
          <CardContent className="p-6">
            {/* Photo */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-2 ring-border shadow-md">
                  <AvatarImage
                    src={form.photoUrl || undefined}
                    alt={form.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-display text-2xl font-bold">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Upload photo"
                  >
                    {photoUploading ? (
                      <Loader2 className="h-5 w-5 text-card animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-card" />
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  data-ocid="profile.photo_upload"
                />
              </div>

              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {form.name || "Your Name"}
                </h2>
                <Badge className="bg-accent/10 text-accent border border-accent/20 text-xs">
                  Intern
                </Badge>
                {form.bio && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                    {form.bio}
                  </p>
                )}
              </div>

              {/* Completeness */}
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Profile completeness
                  </span>
                  <span className="font-semibold text-foreground">
                    {completion}%
                  </span>
                </div>
                <Progress value={completion} className="h-1.5" />
              </div>

              {/* Quick Stats */}
              {avg !== null && (
                <div className="w-full pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Avg. score
                  </p>
                  <StarDisplay avg={avg} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Stacked Sections */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">
                Personal Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Full Name
                  </Label>
                  {editMode ? (
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Your full name"
                      data-ocid="profile.name_input"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">
                      {form.name || (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm text-muted-foreground">{form.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bio</Label>
                {editMode ? (
                  <Textarea
                    value={form.bio}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bio: e.target.value }))
                    }
                    placeholder="Tell the world about yourself..."
                    rows={3}
                    className="resize-none text-sm"
                    data-ocid="profile.bio_input"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {form.bio || (
                      <span className="italic">No bio added yet</span>
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {form.skills.map((skill, idx) => (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      SKILL_COLORS[idx % SKILL_COLORS.length]
                    }`}
                  >
                    {skill}
                    {editMode && (
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:opacity-70 transition-opacity"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
                {form.skills.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">
                    No skills added yet
                  </span>
                )}
              </div>
              {editMode && (
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Add a skill (e.g. React, Python)..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="text-sm"
                    data-ocid="profile.skill_input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSkill}
                    className="gap-1 shrink-0"
                    data-ocid="profile.add_skill_button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Links */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: "github" as const,
                  icon: Github,
                  label: "GitHub",
                  placeholder: "https://github.com/username",
                },
                {
                  key: "linkedin" as const,
                  icon: Linkedin,
                  label: "LinkedIn",
                  placeholder: "https://linkedin.com/in/username",
                },
                {
                  key: "portfolio" as const,
                  icon: Globe,
                  label: "Portfolio",
                  placeholder: "https://yourportfolio.com",
                },
                {
                  key: "twitter" as const,
                  icon: Twitter,
                  label: "Twitter / X",
                  placeholder: "https://twitter.com/username",
                },
              ].map(({ key, icon: Icon, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editMode ? (
                      <Input
                        value={form[key]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [key]: e.target.value }))
                        }
                        placeholder={placeholder}
                        className="text-sm h-8"
                        data-ocid={`profile.${key}_input`}
                      />
                    ) : form[key] ? (
                      <a
                        href={form[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline flex items-center gap-1 truncate"
                      >
                        <Link2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{form[key]}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {label} not added
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Performance Scores */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">
                  Performance Scores
                </CardTitle>
                {avg !== null && <StarDisplay avg={avg} />}
              </div>
            </CardHeader>
            <CardContent>
              {scores.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No scores yet — your admin will rate your performance here.
                </p>
              ) : (
                <div
                  className="space-y-2 max-h-56 overflow-y-auto pr-1"
                  data-ocid="profile.scores_list"
                >
                  {scores.map((s) => (
                    <div
                      key={`${String(s.timestamp)}-${s.category}`}
                      className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {s.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            Number(s.timestamp) / 1_000_000,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-4 w-4 ${
                              n <= Number(s.score)
                                ? "fill-warning text-warning"
                                : "fill-none text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      {s.feedback && (
                        <p className="text-xs text-muted-foreground">
                          {s.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Onboarding Checklist */}
          {checklist.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">
                    Onboarding Checklist
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {completedChecklist}/{checklist.length} completed
                  </span>
                </div>
                <Progress value={checklistProgress} className="h-1.5 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-ocid="profile.checklist">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <button
                        type="button"
                        disabled={
                          item.isCompleted || completingItem === item.id
                        }
                        onClick={() => handleCompleteItem(item.id)}
                        className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        aria-label={
                          item.isCompleted ? "Completed" : "Mark as complete"
                        }
                        data-ocid={`profile.checklist_item.${item.id}`}
                      >
                        {completingItem === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : item.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground hover:text-accent transition-colors" />
                        )}
                      </button>
                      <span
                        className={`text-sm ${
                          item.isCompleted
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.isCompleted && item.completedAt && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(
                            Number(item.completedAt) / 1_000_000,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
