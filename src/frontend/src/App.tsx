import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AuthFlow } from "./components/AuthFlow";
import { OrdersPage } from "./components/OrdersPage";
import { PortfolioPage } from "./components/PortfolioPage";
import { PositionsPage } from "./components/PositionsPage";
import { type NavSection, Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { WatchlistPage } from "./components/WatchlistPage";
import { useGetSession } from "./hooks/useQueries";

export default function App() {
  const { data: session, isLoading } = useGetSession();
  const [activeSection, setActiveSection] = useState<NavSection>("watchlist");

  const isAuthenticated =
    !!session && !!session.accessToken && !!session.sessionToken;

  function handleLogout() {
    // Session invalidation handled by useClearSession in TopBar
    window.location.reload();
  }

  function handleAuthSuccess() {
    // Trigger reload to pick up new session
    window.location.reload();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background terminal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading InstaTrader...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthFlow onSuccess={handleAuthSuccess} />
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "oklch(0.17 0.008 240)",
              border: "1px solid oklch(0.25 0.008 240)",
              color: "oklch(0.92 0.008 240)",
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <TopBar mobileNumber={session?.mobileNumber} onLogout={handleLogout} />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar active={activeSection} onChange={setActiveSection} />

        {/* Content */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex flex-col"
            >
              {activeSection === "watchlist" && <WatchlistPage />}
              {activeSection === "orders" && <OrdersPage />}
              {activeSection === "portfolio" && <PortfolioPage />}
              {activeSection === "positions" && <PositionsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer strip */}
      <footer className="h-6 bg-sidebar border-t border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">
            InstaTrader Terminal
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">
            Kotak Neo API
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </span>
      </footer>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.17 0.008 240)",
            border: "1px solid oklch(0.25 0.008 240)",
            color: "oklch(0.92 0.008 240)",
          },
        }}
      />
    </div>
  );
}
