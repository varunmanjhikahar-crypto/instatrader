import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
  BarChart2,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { SymbolInfo } from "../backend.d.ts";
import {
  useAddToWatchlist,
  useGetWatchlist,
  useRealtimeQuotes,
  useRemoveFromWatchlist,
} from "../hooks/useQueries";
import { MarketDepth } from "./MarketDepth";
import { OrderPanel } from "./OrderPanel";

interface QuoteData {
  nSymbol?: string;
  sym?: string;
  ltp?: string;
  change?: string;
  pChange?: string;
  vol?: string;
  high?: string;
  low?: string;
  exchSeg?: string;
}

function parseQuotes(raw: string): Record<string, QuoteData> {
  try {
    const parsed = JSON.parse(raw) as { data?: QuoteData[] } | QuoteData[];
    const arr = Array.isArray(parsed) ? parsed : (parsed?.data ?? []);
    const map: Record<string, QuoteData> = {};
    for (const q of arr) {
      const key = q.nSymbol || q.sym || "";
      if (key) map[key] = q;
    }
    return map;
  } catch {
    return {};
  }
}

export function WatchlistPage() {
  const { data: watchlist = [], isLoading: wlLoading } = useGetWatchlist();
  const instrumentTokens = watchlist.map((s) => ({
    token: s.token,
    exchange: s.exchange,
  }));
  const { data: quotesRaw, isLoading: qLoading } =
    useRealtimeQuotes(instrumentTokens);
  const quotes = parseQuotes(quotesRaw || "{}");

  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const [showAdd, setShowAdd] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newExchange, setNewExchange] = useState("NSE");
  const [newToken, setNewToken] = useState("");
  const [newName, setNewName] = useState("");

  const [orderPanel, setOrderPanel] = useState<{
    symbol: string;
    exchange: string;
    token: string;
    ltp?: string;
    side: "BUY" | "SELL";
  } | null>(null);

  const [depthPanel, setDepthPanel] = useState<{
    symbol: string;
    exchange: string;
    token: string;
  } | null>(null);

  const prevQuotesRef = useRef<Record<string, string>>({});

  const getFlashClass = useCallback((symbol: string, currentLtp: string) => {
    const prev = prevQuotesRef.current[symbol];
    if (!prev || prev === currentLtp) return "";
    const flash =
      Number.parseFloat(currentLtp) > Number.parseFloat(prev)
        ? "flash-up"
        : "flash-down";
    prevQuotesRef.current[symbol] = currentLtp;
    return flash;
  }, []);

  // Update prev quotes
  for (const sym of Object.keys(quotes)) {
    const ltp = quotes[sym]?.ltp || "";
    if (!(sym in prevQuotesRef.current)) {
      prevQuotesRef.current[sym] = ltp;
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newSymbol || !newToken) {
      toast.error("Symbol and token are required");
      return;
    }
    try {
      await addToWatchlist.mutateAsync({
        symbol: newSymbol.toUpperCase(),
        exchange: newExchange,
        token: newToken,
        instrumentName: newName || newSymbol.toUpperCase(),
      });
      toast.success(`${newSymbol.toUpperCase()} added to watchlist`);
      setNewSymbol("");
      setNewToken("");
      setNewName("");
      setShowAdd(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to add: ${msg}`);
    }
  }

  async function handleRemove(symbol: string, exchange: string) {
    try {
      await removeFromWatchlist.mutateAsync({ symbol, exchange });
      toast.success(`${symbol} removed`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to remove: ${msg}`);
    }
  }

  const openOrderPanel = (item: SymbolInfo, side: "BUY" | "SELL") => {
    const q = quotes[item.symbol] || quotes[item.instrumentName] || {};
    setOrderPanel({
      symbol: item.symbol,
      exchange: item.exchange,
      token: item.token,
      ltp: q.ltp,
      side,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Watchlist</h2>
          <span className="text-xs text-muted-foreground">
            ({watchlist.length} instruments)
          </span>
          {qLoading && (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs border-border hover:border-primary hover:text-primary"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {/* Add instrument form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleAdd}
              className="px-4 py-3 border-b border-border bg-accent/20 flex flex-wrap gap-2 items-end"
            >
              <div className="space-y-1 w-28">
                <label
                  htmlFor="wl-symbol"
                  className="text-xs text-muted-foreground"
                >
                  Symbol *
                </label>
                <Input
                  id="wl-symbol"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="INFY"
                  className="h-7 text-xs bg-input font-mono"
                />
              </div>
              <div className="space-y-1 w-24">
                <label
                  htmlFor="wl-exchange"
                  className="text-xs text-muted-foreground"
                >
                  Exchange
                </label>
                <Input
                  id="wl-exchange"
                  value={newExchange}
                  onChange={(e) => setNewExchange(e.target.value)}
                  placeholder="NSE"
                  className="h-7 text-xs bg-input font-mono"
                />
              </div>
              <div className="space-y-1 w-28">
                <label
                  htmlFor="wl-token"
                  className="text-xs text-muted-foreground"
                >
                  Token *
                </label>
                <Input
                  id="wl-token"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="1234"
                  className="h-7 text-xs bg-input font-mono"
                />
              </div>
              <div className="space-y-1 w-36">
                <label
                  htmlFor="wl-name"
                  className="text-xs text-muted-foreground"
                >
                  Name
                </label>
                <Input
                  id="wl-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Instrument name"
                  className="h-7 text-xs bg-input"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs bg-primary"
                disabled={addToWatchlist.isPending}
              >
                {addToWatchlist.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {wlLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton
                key={`wl-skel-${i}`}
                className="h-8 w-full bg-accent/50"
              />
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <BarChart2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No instruments in watchlist
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Click "Add" to track instruments
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground py-2 h-8 font-medium w-40">
                  Symbol
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-2 h-8 font-medium text-right">
                  LTP
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-2 h-8 font-medium text-right">
                  Chg
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-2 h-8 font-medium text-right">
                  Chg%
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-2 h-8 font-medium text-right hidden lg:table-cell">
                  Volume
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-2 h-8 font-medium text-right hidden lg:table-cell">
                  High
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-2 h-8 font-medium text-right hidden lg:table-cell">
                  Low
                </TableHead>
                <TableHead className="text-xs text-muted-foreground py-2 h-8 font-medium text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlist.map((item) => {
                const q =
                  quotes[item.symbol] || quotes[item.instrumentName] || {};
                const ltp = q.ltp || "-";
                const change = q.change || "0";
                const pChange = q.pChange || "0";
                const isPositive = Number.parseFloat(change) >= 0;
                const flashClass =
                  ltp !== "-" ? getFlashClass(item.symbol, ltp) : "";

                return (
                  <TableRow
                    key={`${item.exchange}:${item.symbol}`}
                    className="data-row border-border h-9"
                  >
                    <TableCell className="py-1.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold font-mono">
                          {item.symbol}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.exchange}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`py-1.5 text-right num text-xs font-medium ${flashClass}`}
                    >
                      {ltp !== "-" ? `₹${ltp}` : "-"}
                    </TableCell>
                    <TableCell
                      className={`py-1.5 text-right num text-xs ${
                        isPositive ? "text-buy" : "text-sell"
                      }`}
                    >
                      <span className="flex items-center justify-end gap-0.5">
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {change}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`py-1.5 text-right num text-xs ${
                        isPositive ? "text-buy" : "text-sell"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {pChange}%
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden lg:table-cell">
                      {q.vol
                        ? Number.parseInt(q.vol).toLocaleString("en-IN")
                        : "-"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden lg:table-cell">
                      {q.high ? `₹${q.high}` : "-"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden lg:table-cell">
                      {q.low ? `₹${q.low}` : "-"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px] font-bold bg-buy/20 text-buy hover:bg-buy hover:text-white border-0"
                          onClick={() => openOrderPanel(item, "BUY")}
                        >
                          B
                        </Button>
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px] font-bold bg-sell/20 text-sell hover:bg-sell hover:text-white border-0"
                          onClick={() => openOrderPanel(item, "SELL")}
                        >
                          S
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-popover border-border text-xs"
                          >
                            <DropdownMenuItem
                              className="text-xs gap-2 cursor-pointer"
                              onClick={() =>
                                setDepthPanel({
                                  symbol: item.symbol,
                                  exchange: item.exchange,
                                  token: item.token,
                                })
                              }
                            >
                              <BarChart2 className="w-3 h-3" />
                              Market Depth
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-xs gap-2 text-sell cursor-pointer"
                              onClick={() =>
                                handleRemove(item.symbol, item.exchange)
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Order Panel */}
      {orderPanel && (
        <OrderPanel
          isOpen={!!orderPanel}
          onClose={() => setOrderPanel(null)}
          symbol={orderPanel.symbol}
          exchange={orderPanel.exchange}
          token={orderPanel.token}
          ltp={orderPanel.ltp}
          defaultSide={orderPanel.side}
        />
      )}

      {/* Market Depth */}
      {depthPanel && (
        <MarketDepth
          isOpen={!!depthPanel}
          onClose={() => setDepthPanel(null)}
          symbol={depthPanel.symbol}
          exchange={depthPanel.exchange}
          token={depthPanel.token}
        />
      )}
    </div>
  );
}
