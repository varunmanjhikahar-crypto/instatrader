import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCancelOrder, useRealtimeOrders } from "../hooks/useQueries";

interface Order {
  nOrdNo?: string;
  orderId?: string;
  sym?: string;
  symbol?: string;
  trnsTp?: string;
  transactionType?: string;
  ordTp?: string;
  orderType?: string;
  qty?: string;
  quantity?: string;
  prc?: string;
  price?: string;
  ordSt?: string;
  status?: string;
  avgPrc?: string;
  avgPrice?: string;
  fldQty?: string;
  filledQty?: string;
  exchOrdId?: string;
  rejRsn?: string;
  product?: string;
  prd?: string;
}

function parseOrders(raw: string): Order[] {
  try {
    const parsed = JSON.parse(raw) as { data?: Order[] } | Order[];
    if (Array.isArray(parsed)) return parsed;
    return parsed?.data ?? [];
  } catch {
    return [];
  }
}

function getOrderId(o: Order): string {
  return o.nOrdNo || o.orderId || "-";
}
function getSymbol(o: Order): string {
  return o.sym || o.symbol || "-";
}
function getTransactionType(o: Order): string {
  return o.trnsTp || o.transactionType || "-";
}
function getOrderType(o: Order): string {
  return o.ordTp || o.orderType || "-";
}
function getQty(o: Order): string {
  return o.qty || o.quantity || "-";
}
function getPrice(o: Order): string {
  return o.prc || o.price || "-";
}
function getStatus(o: Order): string {
  return o.ordSt || o.status || "-";
}
function getAvgPrice(o: Order): string {
  return o.avgPrc || o.avgPrice || "-";
}
function getFilledQty(o: Order): string {
  return o.fldQty || o.filledQty || "0";
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("open") || s.includes("pending") || s.includes("trig")) {
    return (
      <Badge className="text-[10px] h-4 px-1.5 bg-warning/20 text-warning border-warning/30">
        {status}
      </Badge>
    );
  }
  if (
    s.includes("complete") ||
    s.includes("executed") ||
    s.includes("filled")
  ) {
    return (
      <Badge className="text-[10px] h-4 px-1.5 bg-buy/20 text-buy border-buy/30">
        {status}
      </Badge>
    );
  }
  if (s.includes("cancel") || s.includes("reject")) {
    return (
      <Badge className="text-[10px] h-4 px-1.5 bg-sell/20 text-sell border-sell/30">
        {status}
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] h-4 px-1.5 bg-muted text-muted-foreground">
      {status}
    </Badge>
  );
}

function isOpenOrder(o: Order): boolean {
  const s = getStatus(o).toLowerCase();
  return (
    s.includes("open") ||
    s.includes("pending") ||
    s.includes("trigger") ||
    s === "confirmed"
  );
}

function isExecutedOrder(o: Order): boolean {
  const s = getStatus(o).toLowerCase();
  return (
    s.includes("complete") || s.includes("executed") || s.includes("filled")
  );
}

export function OrdersPage() {
  const { data: rawOrders, isLoading, refetch } = useRealtimeOrders();
  const cancelOrder = useCancelOrder();
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const orders = parseOrders(rawOrders || "{}");
  const openOrders = orders.filter(isOpenOrder);
  const executedOrders = orders.filter(isExecutedOrder);

  async function handleCancel(orderId: string) {
    setCancelingId(orderId);
    try {
      const result = await cancelOrder.mutateAsync(orderId);
      toast.success(`Order cancelled: ${result}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Cancel failed: ${msg}`);
    } finally {
      setCancelingId(null);
    }
  }

  function OrderTable({
    rows,
    showCancel = false,
  }: {
    rows: Order[];
    showCancel?: boolean;
  }) {
    if (rows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-40">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No orders found</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent h-8">
            <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium">
              Order ID
            </TableHead>
            <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium">
              Symbol
            </TableHead>
            <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium">
              Type
            </TableHead>
            <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
              Qty
            </TableHead>
            <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
              Price
            </TableHead>
            <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right hidden md:table-cell">
              Avg Price
            </TableHead>
            <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right hidden md:table-cell">
              Filled
            </TableHead>
            <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium">
              Status
            </TableHead>
            {showCancel && (
              <TableHead className="text-xs text-muted-foreground py-1 h-8 font-medium text-right">
                Action
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((order, i) => {
            const orderId = getOrderId(order);
            const txType = getTransactionType(order);
            return (
              <motion.tr
                key={orderId !== "-" ? orderId : `order-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="data-row border-border h-9"
              >
                <TableCell className="py-1.5 text-xs font-mono text-muted-foreground">
                  {orderId.slice(-8)}
                </TableCell>
                <TableCell className="py-1.5 text-xs font-semibold font-mono">
                  {getSymbol(order)}
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={`text-xs font-bold ${
                        txType === "B" || txType === "BUY"
                          ? "text-buy"
                          : "text-sell"
                      }`}
                    >
                      {txType === "B"
                        ? "BUY"
                        : txType === "S"
                          ? "SELL"
                          : txType}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {getOrderType(order)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5 text-right num text-xs">
                  {getQty(order)}
                </TableCell>
                <TableCell className="py-1.5 text-right num text-xs">
                  {getPrice(order) !== "-" ? `₹${getPrice(order)}` : "-"}
                </TableCell>
                <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden md:table-cell">
                  {getAvgPrice(order) !== "-" ? `₹${getAvgPrice(order)}` : "-"}
                </TableCell>
                <TableCell className="py-1.5 text-right num text-xs text-muted-foreground hidden md:table-cell">
                  {getFilledQty(order)}
                </TableCell>
                <TableCell className="py-1.5">
                  {getStatusBadge(getStatus(order))}
                </TableCell>
                {showCancel && (
                  <TableCell className="py-1.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-sell hover:bg-sell/10 hover:text-sell"
                      onClick={() => handleCancel(orderId)}
                      disabled={cancelingId === orderId}
                    >
                      {cancelingId === orderId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Cancel"
                      )}
                    </Button>
                  </TableCell>
                )}
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Orders</h2>
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

      <Tabs
        defaultValue="open"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-2 h-8 bg-muted/50 w-fit shrink-0">
          <TabsTrigger value="open" className="text-xs h-6 px-3">
            Open ({openOrders.length})
          </TabsTrigger>
          <TabsTrigger value="executed" className="text-xs h-6 px-3">
            Executed ({executedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs h-6 px-3">
            All ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="flex-1 overflow-auto mt-2">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton
                  key={`open-skel-${i}`}
                  className="h-8 w-full bg-accent/50"
                />
              ))}
            </div>
          ) : (
            <OrderTable rows={openOrders} showCancel />
          )}
        </TabsContent>
        <TabsContent value="executed" className="flex-1 overflow-auto mt-2">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton
                  key={`exec-skel-${i}`}
                  className="h-8 w-full bg-accent/50"
                />
              ))}
            </div>
          ) : (
            <OrderTable rows={executedOrders} />
          )}
        </TabsContent>
        <TabsContent value="all" className="flex-1 overflow-auto mt-2">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton
                  key={`all-skel-${i}`}
                  className="h-8 w-full bg-accent/50"
                />
              ))}
            </div>
          ) : (
            <OrderTable rows={orders} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
