import { Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useGetMarketDepth } from "../hooks/useQueries";

interface DepthLevel {
  price: string;
  quantity: string;
  orders: string;
}

interface DepthData {
  bids?: DepthLevel[];
  asks?: DepthLevel[];
  data?: {
    bids?: DepthLevel[];
    asks?: DepthLevel[];
    depth?: { buy?: DepthLevel[]; sell?: DepthLevel[] };
  };
}

function parseDepth(raw: string): { bids: DepthLevel[]; asks: DepthLevel[] } {
  try {
    const parsed = JSON.parse(raw) as DepthData;
    // Try multiple response shapes
    const data = parsed?.data || parsed;
    const bids: DepthLevel[] =
      (data as { bids?: DepthLevel[] })?.bids ||
      (data as { depth?: { buy?: DepthLevel[] } })?.depth?.buy ||
      [];
    const asks: DepthLevel[] =
      (data as { asks?: DepthLevel[] })?.asks ||
      (data as { depth?: { sell?: DepthLevel[] } })?.depth?.sell ||
      [];
    return { bids: bids.slice(0, 5), asks: asks.slice(0, 5) };
  } catch {
    return { bids: [], asks: [] };
  }
}

interface MarketDepthProps {
  symbol: string;
  exchange: string;
  token: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MarketDepth({
  symbol,
  exchange,
  token,
  isOpen,
  onClose,
}: MarketDepthProps) {
  const { data, isLoading } = useGetMarketDepth(
    isOpen ? exchange : "",
    isOpen ? token : "",
  );

  const { bids, asks } = data ? parseDepth(data) : { bids: [], asks: [] };

  const maxBidQty = Math.max(
    ...bids.map((b) => Number.parseFloat(b.quantity) || 0),
    1,
  );
  const maxAskQty = Math.max(
    ...asks.map((a) => Number.parseFloat(a.quantity) || 0),
    1,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-card border border-border rounded-lg shadow-card z-40"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <span className="font-semibold text-sm">{symbol}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {exchange}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Depth content */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Bids */}
                  <div>
                    <div className="grid grid-cols-3 text-xs text-muted-foreground mb-2 font-medium">
                      <span>Price</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Orders</span>
                    </div>
                    {bids.length > 0 ? (
                      bids.map((bid) => (
                        <div key={`bid-${bid.price}`} className="relative">
                          <div
                            className="absolute inset-0 depth-bar-buy rounded"
                            style={{
                              width: `${(Number.parseFloat(bid.quantity) / maxBidQty) * 100}%`,
                            }}
                          />
                          <div className="relative grid grid-cols-3 text-xs py-0.5">
                            <span className="num text-buy font-medium">
                              {bid.price}
                            </span>
                            <span className="num text-center text-foreground">
                              {bid.quantity}
                            </span>
                            <span className="num text-right text-muted-foreground">
                              {bid.orders}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No bids
                      </p>
                    )}
                  </div>

                  {/* Asks */}
                  <div>
                    <div className="grid grid-cols-3 text-xs text-muted-foreground mb-2 font-medium">
                      <span>Price</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Orders</span>
                    </div>
                    {asks.length > 0 ? (
                      asks.map((ask) => (
                        <div key={`ask-${ask.price}`} className="relative">
                          <div
                            className="absolute inset-0 depth-bar-sell rounded"
                            style={{
                              width: `${(Number.parseFloat(ask.quantity) / maxAskQty) * 100}%`,
                            }}
                          />
                          <div className="relative grid grid-cols-3 text-xs py-0.5">
                            <span className="num text-sell font-medium">
                              {ask.price}
                            </span>
                            <span className="num text-center text-foreground">
                              {ask.quantity}
                            </span>
                            <span className="num text-right text-muted-foreground">
                              {ask.orders}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No asks
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
