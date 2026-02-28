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
  Activity,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useRealtimePositions } from "../hooks/useQueries";

interface Position {
  sym?: string;
  symbol?: string;
  exch?: string;
  exchange?: string;
  netQty?: string;
  buyQty?: string;
  sellQty?: string;
  buyAvg?: string;
  sellAvg?: string;
  mtm?: string;
  realPnl?: string;
  unrealPnl?: string;
  product?: string;
  prd?: string;
}

function parsePositions(raw: string): Position[] {
  try {
    const parsed = JSON.parse(raw) as { data?: Position[] } | Position[];
    if (Array.isArray(parsed)) return parsed;
    return parsed?.data ?? [];
  } catch {
    return [];
  }
}

function getSymbol(p: Position): string {
  return p.sym || p.symbol || "-";
}
function getExchange(p: Position): string {
  return p.exch || p.exchange || "-";
}
function getProduct(p: Position): string {
  return p.product || p.prd || "-";
}

function getMtm(p: Position): number {
  return Number.parseFloat(p.mtm || "0");
}
function getRealPnl(p: Position): number {
  return Number.parseFloat(p.realPnl || "0");
}

export function PositionsPage() {
  const { data: rawPositions, isLoading, refetch } = useRealtimePositions();
  const positions = parsePositions(rawPositions || "{}");

  const totalMtm = positions.reduce((sum, p) => sum + getMtm(p), 0);
  const totalRealPnl = positions.reduce((sum, p) => sum + getRealPnl(p), 0);
  const isMtmPositive = totalMtm >= 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Positions</h2>
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
      {!isLoading && positions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 mb-2 grid grid-cols-2 gap-3 shrink-0"
        >
          <div className="p-3 rounded bg-card border border-border">
            <p className="text-xs text-muted-foreground">MTM P&L</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isMtmPositive ? (
                <TrendingUp className="w-3 h-3 text-buy" />
              ) : (
                <TrendingDown className="w-3 h-3 text-sell" />
              )}
              <span
                className={`num text-base font-bold ${
                  isMtmPositive ? "text-buy" : "text-sell"
                }`}
              >
                {isMtmPositive ? "+" : ""}₹
                {totalMtm.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <div className="p-3 rounded bg-card border border-border">
            <p className="text-xs text-muted-foreground">Realized P&L</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {totalRealPnl >= 0 ? (
                <TrendingUp className="w-3 h-3 text-buy" />
              ) : (
                <TrendingDown className="w-3 h-3 text-sell" />
              )}
              <span
                className={`num text-base font-bold ${
                  totalRealPnl >= 0 ? "text-buy" : "text-sell"
                }`}
              >
                {totalRealPnl >= 0 ? "+" : ""}₹
                {totalRealPnl.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
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
                key={`pos-skel-${i}`}
                className="h-8 w-full bg-accent/50"
              />
            ))}
          </div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No positions found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Your intraday positions will appear here
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
                  Net Qty
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right hidden md:table-cell">
                  Buy Qty
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right hidden md:table-cell">
                  Sell Qty
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right hidden lg:table-cell">
                  Buy Avg
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right hidden lg:table-cell">
                  Sell Avg
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
                  MTM
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
                  Realized
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((pos, i) => {
                const mtm = getMtm(pos);
                const realPnl = getRealPnl(pos);
                const netQty = Number.parseInt(pos.netQty || "0");
                const isMtmPos = mtm >= 0;
                const isRealPos = realPnl >= 0;

                return (
                  <motion.tr
                    key={`${getSymbol(pos)}-${i}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="data-row border-border h-9"
                  >
                    <TableCell className="py-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold font-mono">
                          {getSymbol(pos)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {getExchange(pos)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            · {getProduct(pos)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`py-1.5 text-right num text-xs font-bold ${
                        netQty > 0
                          ? "text-buy"
                          : netQty < 0
                            ? "text-sell"
                            : "text-muted-foreground"
                      }`}
                    >
                      {netQty > 0 ? `+${netQty}` : netQty}
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden md:table-cell">
                      {pos.buyQty || "0"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden md:table-cell">
                      {pos.sellQty || "0"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden lg:table-cell">
                      {pos.buyAvg ? `₹${pos.buyAvg}` : "-"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden lg:table-cell">
                      {pos.sellAvg ? `₹${pos.sellAvg}` : "-"}
                    </TableCell>
                    <TableCell
                      className={`py-1.5 text-right num text-xs font-medium ${
                        isMtmPos ? "text-buy" : "text-sell"
                      }`}
                    >
                      {isMtmPos ? "+" : ""}₹
                      {Math.abs(mtm).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell
                      className={`py-1.5 text-right num text-xs font-medium ${
                        isRealPos ? "text-buy" : "text-sell"
                      }`}
                    >
                      {isRealPos ? "+" : ""}₹
                      {Math.abs(realPnl).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
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
