import { Button } from "@/components/ui/button";
import { Loader2, LogOut, TrendingUp, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useClearSession } from "../hooks/useQueries";

interface TopBarProps {
  mobileNumber?: string;
  onLogout: () => void;
}

export function TopBar({ mobileNumber, onLogout }: TopBarProps) {
  const [time, setTime] = useState(new Date());
  const clearSession = useClearSession();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleLogout() {
    try {
      await clearSession.mutateAsync();
      onLogout();
    } catch {
      toast.error("Logout failed");
    }
  }

  const isMarketHours = (() => {
    const h = time.getHours();
    const m = time.getMinutes();
    const mins = h * 60 + m;
    return mins >= 555 && mins <= 930; // 9:15 AM - 3:30 PM
  })();

  const timeStr = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const dateStr = time.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="h-10 bg-sidebar border-b border-border flex items-center px-3 gap-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">
          InstaTrader
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          / Kotak Neo
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Market status */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isMarketHours ? "bg-buy blink" : "bg-muted-foreground"
          }`}
        />
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {isMarketHours ? (
            <span className="text-buy">MARKET OPEN</span>
          ) : (
            "MARKET CLOSED"
          )}
        </span>
      </div>

      <div className="flex-1" />

      {/* Live clock */}
      <div className="flex items-center gap-2 text-xs">
        <Wifi className="w-3 h-3 text-primary" />
        <span className="num text-foreground font-medium">{timeStr}</span>
        <span className="text-muted-foreground hidden md:inline">
          {dateStr}
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* User */}
      {mobileNumber && (
        <span className="num text-xs text-muted-foreground hidden sm:inline">
          {mobileNumber}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-sell hover:bg-sell/10"
        onClick={handleLogout}
        disabled={clearSession.isPending}
      >
        {clearSession.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <LogOut className="w-3 h-3" />
        )}
        <span className="hidden sm:inline ml-1">Logout</span>
      </Button>
    </header>
  );
}
