import { Loader2 } from "lucide-react";
import React from "react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}
