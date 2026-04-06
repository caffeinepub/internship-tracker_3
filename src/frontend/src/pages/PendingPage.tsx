import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function PendingPage() {
  const { profile } = useAuth();
  const { clear } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Registration Pending
          </h1>
          <p className="text-muted-foreground">
            Your registration has been submitted and is awaiting admin approval.
            We'll notify you once reviewed.
          </p>
        </div>

        {profile && (
          <div className="text-left bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Submitted details
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="text-foreground">Name:</span> {profile.name}
              </p>
              <p>
                <span className="text-foreground">Email:</span> {profile.email}
              </p>
              {profile.bio && (
                <p>
                  <span className="text-foreground">Bio:</span> {profile.bio}
                </p>
              )}
            </div>
          </div>
        )}

        <Button variant="outline" onClick={clear} className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
