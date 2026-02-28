import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { usePlaceOrder } from "../hooks/useQueries";

interface OrderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  exchange: string;
  token: string;
  ltp?: string;
  defaultSide?: "BUY" | "SELL";
}

type OrderType = "MARKET" | "LIMIT" | "SL" | "SL-M";
type Product = "CNC" | "MIS" | "NRML";

export function OrderPanel({
  isOpen,
  onClose,
  symbol,
  exchange,
  token,
  ltp,
  defaultSide = "BUY",
}: OrderPanelProps) {
  const [side, setSide] = useState<"BUY" | "SELL">(defaultSide);
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [product, setProduct] = useState<Product>("CNC");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(ltp || "");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const placeOrder = usePlaceOrder();

  const isPriceEnabled = orderType === "LIMIT" || orderType === "SL";
  const isTriggerEnabled = orderType === "SL" || orderType === "SL-M";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quantity || Number.parseInt(quantity) <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (isPriceEnabled && !price) {
      toast.error("Enter a price for this order type");
      return;
    }

    setOrderResult(null);
    try {
      const result = await placeOrder.mutateAsync({
        symbol,
        exchange,
        token,
        transactionType: side,
        orderType,
        quantity: Number.parseInt(quantity),
        price: Number.parseFloat(price) || 0,
        product,
      });
      setOrderResult({ success: true, message: result });
      toast.success(`Order placed: ${result}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOrderResult({ success: false, message: msg });
      toast.error(`Order failed: ${msg}`);
    }
  }

  function handleClose() {
    setOrderResult(null);
    setQuantity("");
    setPrice(ltp || "");
    setTriggerPrice("");
    setOrderType("MARKET");
    setProduct("CNC");
    onClose();
  }

  const orderTypes: OrderType[] = ["MARKET", "LIMIT", "SL", "SL-M"];
  const products: Product[] = ["CNC", "MIS", "NRML"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-card border-l border-border z-50 flex flex-col shadow-card"
          >
            {/* Header */}
            <div
              className={`px-4 py-3 border-b border-border flex items-center justify-between ${
                side === "BUY"
                  ? "bg-buy/10 border-b-buy/30"
                  : "bg-sell/10 border-b-sell/30"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      side === "BUY"
                        ? "bg-buy/20 text-buy"
                        : "bg-sell/20 text-sell"
                    }`}
                  >
                    {side}
                  </span>
                  <span className="font-semibold text-sm">{symbol}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {exchange}
                  </span>
                  {ltp && (
                    <span className="num text-xs text-foreground">₹{ltp}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* BUY / SELL toggle */}
                <div className="flex gap-1">
                  {(["BUY", "SELL"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSide(s)}
                      className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${
                        side === s && s === "BUY"
                          ? "bg-buy text-white border-buy"
                          : side === s && s === "SELL"
                            ? "bg-sell text-white border-sell"
                            : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Order Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Order Type
                  </Label>
                  <div className="grid grid-cols-4 gap-1">
                    {orderTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setOrderType(t)}
                        className={`order-type-btn text-center ${
                          orderType === t
                            ? side === "BUY"
                              ? "selected-buy"
                              : "selected-sell"
                            : ""
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Product
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {products.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProduct(p)}
                        className={`order-type-btn text-center ${
                          product === p
                            ? side === "BUY"
                              ? "selected-buy"
                              : "selected-sell"
                            : ""
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="bg-input border-border font-mono text-sm h-9"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <Label
                    className={`text-xs uppercase tracking-wider ${
                      isPriceEnabled
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    Price
                  </Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={
                      isPriceEnabled ? "Enter price" : "Market price"
                    }
                    disabled={!isPriceEnabled}
                    className={`bg-input border-border font-mono text-sm h-9 ${
                      !isPriceEnabled ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                {/* Trigger Price */}
                <div className="space-y-1.5">
                  <Label
                    className={`text-xs uppercase tracking-wider ${
                      isTriggerEnabled
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    Trigger Price
                  </Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(e.target.value)}
                    placeholder={
                      isTriggerEnabled ? "Enter trigger price" : "N/A"
                    }
                    disabled={!isTriggerEnabled}
                    className={`bg-input border-border font-mono text-sm h-9 ${
                      !isTriggerEnabled ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                {/* Order result */}
                <AnimatePresence>
                  {orderResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`rounded p-3 text-xs flex items-start gap-2 ${
                        orderResult.success
                          ? "bg-buy/10 border border-buy/20 text-buy"
                          : "bg-sell/10 border border-sell/20 text-sell"
                      }`}
                    >
                      {orderResult.success ? (
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <span className="font-mono break-all">
                        {orderResult.message}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button
                type="submit"
                form="order-form"
                onClick={handleSubmit}
                disabled={placeOrder.isPending}
                className={`w-full h-9 text-sm font-bold ${
                  side === "BUY"
                    ? "bg-buy hover:bg-buy/90 text-white"
                    : "bg-sell hover:bg-sell/90 text-white"
                }`}
              >
                {placeOrder.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `${side} ${symbol}`
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
