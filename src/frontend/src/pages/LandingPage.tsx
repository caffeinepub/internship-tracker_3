import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">
              IT
            </span>
          </div>
          <span className="font-display font-semibold text-foreground">
            Internship Tracker
          </span>
        </div>
        <Button
          onClick={login}
          disabled={isLoggingIn || isInitializing}
          variant="outline"
          size="sm"
        >
          {isLoggingIn ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Sign In
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-sm text-accent font-medium">
            Phase 1 — Core Foundation
          </div>
          <h1 className="font-display text-5xl font-bold text-foreground leading-tight">
            Manage Your Internship Program
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Track intern registrations, manage projects, and oversee your
            internship program — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isLoggingIn ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isLoggingIn
                ? "Connecting..."
                : "Get Started with Internet Identity"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Secured by Internet Identity — no passwords required
          </p>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-border px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              title: "Role-Based Access",
              desc: "Admins manage interns; interns view their assignments",
            },
            {
              title: "Project Tracking",
              desc: "Create and assign internship projects with timelines",
            },
            {
              title: "Approval Workflow",
              desc: "Review and approve intern registrations",
            },
          ].map((f) => (
            <div key={f.title} className="text-center space-y-2">
              <h3 className="font-display font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
