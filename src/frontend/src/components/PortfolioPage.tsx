import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Briefcase,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useGetHoldings } from "../hooks/useQueries";

interface Holding {
  sym?: string;
  symbol?: string;
  exch?: string;
  exchange?: string;
  qty?: string;
  quantity?: string;
  avgPrc?: string;
  avgPrice?: string;
  ltp?: string;
  pnl?: string;
  pnlPerc?: string;
  isin?: string;
}

function parseHoldings(raw: string): Holding[] {
  try {
    const parsed = JSON.parse(raw) as { data?: Holding[] } | Holding[];
    if (Array.isArray(parsed)) return parsed;
    return parsed?.data ?? [];
  } catch {
    return [];
  }
}

function getSymbol(h: Holding): string {
  return h.sym || h.symbol || "-";
}
function getExchange(h: Holding): string {
  return h.exch || h.exchange || "-";
}
function getQty(h: Holding): string {
  return h.qty || h.quantity || "0";
}
function getAvgPrice(h: Holding): string {
  return h.avgPrc || h.avgPrice || "-";
}

function getPnl(h: Holding): number {
  return Number.parseFloat(h.pnl || "0");
}

function getPnlPercent(h: Holding, pnl: number): number {
  if (h.pnlPerc) return Number.parseFloat(h.pnlPerc);
  const avgPrc = Number.parseFloat(getAvgPrice(h));
  const qty = Number.parseFloat(getQty(h));
  if (!avgPrc || !qty) return 0;
  return (pnl / (avgPrc * qty)) * 100;
}

export function PortfolioPage() {
  const { data: rawHoldings, isLoading, refetch } = useGetHoldings();
  const holdings = parseHoldings(rawHoldings || "{}");

  const totalPnl = holdings.reduce((sum, h) => sum + getPnl(h), 0);
  const isTotalPositive = totalPnl >= 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Portfolio</h2>
          {isLoading && (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      {!isLoading && holdings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 mb-2 p-3 rounded bg-card border border-border shrink-0"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total P&L</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isTotalPositive ? (
                  <TrendingUp className="w-4 h-4 text-buy" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-sell" />
                )}
                <span
                  className={`num text-lg font-bold ${
                    isTotalPositive ? "text-buy" : "text-sell"
                  }`}
                >
                  {isTotalPositive ? "+" : ""}₹
                  {totalPnl.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Holdings</p>
              <p className="num text-lg font-bold">{holdings.length}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton
                key={`port-skel-${i}`}
                className="h-8 w-full bg-accent/50"
              />
            ))}
          </div>
        ) : holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No holdings found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Your portfolio is empty or data unavailable
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent h-8">
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium">
                  Symbol
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
                  Qty
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
                  Avg Price
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
                  LTP
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
                  P&L
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right hidden md:table-cell">
                  P&L%
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding, i) => {
                const pnl = getPnl(holding);
                const pnlPct = getPnlPercent(holding, pnl);
                const isPositive = pnl >= 0;

                return (
                  <motion.tr
                    key={`${getSymbol(holding)}-${i}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="data-row border-border h-9"
                  >
                    <TableCell className="py-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold font-mono">
                          {getSymbol(holding)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {getExchange(holding)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs">
                      {getQty(holding)}
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs text-muted-foreground">
                      {getAvgPrice(holding) !== "-"
                        ? `₹${getAvgPrice(holding)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs">
                      {holding.ltp ? `₹${holding.ltp}` : "-"}
                    </TableCell>
                    <TableCell
                      className={`py-1.5 text-right num text-xs font-medium ${
                        isPositive ? "text-buy" : "text-sell"
                      }`}
                    >
                      {isPositive ? "+" : ""}₹
                      {Math.abs(pnl).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell
                      className={`py-1.5 text-right num text-xs hidden md:table-cell ${
                        isPositive ? "text-buy" : "text-sell"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {pnlPct.toFixed(2)}%
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
