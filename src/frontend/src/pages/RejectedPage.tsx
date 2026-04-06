import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function RejectedPage() {
  const { clear } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Registration Rejected
          </h1>
          <p className="text-muted-foreground">
            Unfortunately, your internship registration was not approved. Please
            contact the admin for more information.
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is a mistake, please reach out to your
            internship coordinator directly.
          </p>
        </div>
        <Button variant="outline" onClick={clear} className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
