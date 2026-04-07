import { Toaster } from "@/components/ui/sonner";
import React from "react";
import LoadingScreen from "./components/LoadingScreen";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import AdminShell from "./layouts/AdminShell";
import InternShell from "./layouts/InternShell";
import LandingPage from "./pages/LandingPage";
import PendingPage from "./pages/PendingPage";
import RegistrationPage from "./pages/RegistrationPage";
import RejectedPage from "./pages/RejectedPage";

function AppContent() {
  const { appRole } = useAuth();

  if (appRole === "loading") return <LoadingScreen />;
  if (appRole === "guest") return <LandingPage />;
  if (appRole === "no-profile") return <RegistrationPage />;
  if (appRole === "pending") return <PendingPage />;
  if (appRole === "rejected") return <RejectedPage />;
  if (appRole === "admin") return <AdminShell />;
  return <InternShell />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
