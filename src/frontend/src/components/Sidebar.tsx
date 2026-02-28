import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart2, BookOpen, Briefcase, TrendingUp } from "lucide-react";

export type NavSection = "watchlist" | "orders" | "portfolio" | "positions";

interface SidebarProps {
  active: NavSection;
  onChange: (section: NavSection) => void;
}

const navItems: Array<{
  id: NavSection;
  icon: React.ElementType;
  label: string;
}> = [
  { id: "watchlist", icon: BarChart2, label: "Watchlist" },
  { id: "orders", icon: BookOpen, label: "Orders" },
  { id: "portfolio", icon: Briefcase, label: "Portfolio" },
  { id: "positions", icon: TrendingUp, label: "Positions" },
];

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-14 bg-sidebar border-r border-border flex flex-col items-center py-3 gap-1 shrink-0">
        {navItems.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`nav-icon w-10 h-10 ${active === id ? "active" : ""}`}
                onClick={() => onChange(id)}
                aria-label={label}
                aria-current={active === id ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium leading-none">
                  {label.slice(0, 5)}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  );
}
