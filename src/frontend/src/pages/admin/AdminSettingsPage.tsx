import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import { useAuth } from "../../hooks/useAuth";

export default function AdminSettingsPage() {
  const { actor } = useActor();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    skills: [] as string[],
  });

  useEffect(() => {
    if (!actor) return;
    (async () => {
      setLoading(true);
      try {
        const p = await actor.getCallerUserProfile();
        if (p) {
          setForm({
            name: p.name,
            email: p.email,
            bio: p.bio,
            skills: [...p.skills],
          });
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [actor]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setSaving(true);
    try {
      await actor.updateProfile({
        name: form.name,
        email: form.email,
        bio: form.bio,
        skills: form.skills,
        links: [],
      });
      toast.success("Profile updated");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your profile information
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-display">
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border border-input rounded-md bg-background">
                  {form.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSkill}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
