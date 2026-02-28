import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InstrumentToken, Session, SymbolInfo } from "../backend.d.ts";
import { useActor } from "./useActor";

// ─── Session ──────────────────────────────────────────────────────────────────

export function useGetSession() {
  const { actor, isFetching } = useActor();
  return useQuery<Session | null>({
    queryKey: ["session"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSession();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSaveCredentials() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      consumerKey,
      consumerSecret,
      mobileNumber,
    }: {
      consumerKey: string;
      consumerSecret: string;
      mobileNumber: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.saveCredentials(consumerKey, consumerSecret, mobileNumber);
    },
  });
}

export function useInitiateLogin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      consumerKey,
      consumerSecret,
      mobileNumber,
    }: {
      consumerKey: string;
      consumerSecret: string;
      mobileNumber: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.initiateLogin(consumerKey, consumerSecret, mobileNumber);
    },
  });
}

export function useCompleteLogin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      otp,
      password,
    }: { otp: string; password: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.completeLogin(otp, password);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useClearSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.clearSession();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export function useGetWatchlist() {
  const { actor, isFetching } = useActor();
  return useQuery<SymbolInfo[]>({
    queryKey: ["watchlist"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWatchlist();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToWatchlist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      exchange,
      token,
      instrumentName,
    }: {
      symbol: string;
      exchange: string;
      token: string;
      instrumentName: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addToWatchlist(symbol, exchange, token, instrumentName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      exchange,
    }: {
      symbol: string;
      exchange: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.removeFromWatchlist(symbol, exchange);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

// ─── Realtime Quotes — 1 second polling with fetch-guard ─────────────────────

export function useRealtimeQuotes(instrumentTokens: InstrumentToken[]) {
  const { actor, isFetching: actorFetching } = useActor();
  const [data, setData] = useState<string>("{}");
  const [isLoading, setIsLoading] = useState(true);
  const inFlight = useRef(false);
  const tokensRef = useRef(instrumentTokens);

  // Keep tokens ref current without triggering re-renders
  useEffect(() => {
    tokensRef.current = instrumentTokens;
  });

  const fetchQuotes = useCallback(async () => {
    if (inFlight.current) return;
    if (!actor || actorFetching) return;
    if (tokensRef.current.length === 0) {
      setData("{}");
      setIsLoading(false);
      return;
    }
    inFlight.current = true;
    try {
      const result = await actor.getQuotes(tokensRef.current);
      setData(result);
    } catch {
      // silently ignore transient errors
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [actor, actorFetching]);

  useEffect(() => {
    if (!actor || actorFetching) return;
    fetchQuotes();
    const id = setInterval(fetchQuotes, 1_000);
    return () => clearInterval(id);
  }, [fetchQuotes, actor, actorFetching]);

  return { data, isLoading };
}

// ─── Legacy quotes hook kept for compatibility ────────────────────────────────

export function useGetQuotes(instrumentTokens: InstrumentToken[]) {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: [
      "quotes",
      instrumentTokens.map((t) => `${t.exchange}:${t.token}`).join(","),
    ],
    queryFn: async () => {
      if (!actor || instrumentTokens.length === 0) return "{}";
      return actor.getQuotes(instrumentTokens);
    },
    enabled: !!actor && !isFetching && instrumentTokens.length > 0,
    refetchInterval: 1_000,
    staleTime: 900,
  });
}

// ─── Realtime Orders — 2 second polling with fetch-guard ─────────────────────

export function useRealtimeOrders() {
  const { actor, isFetching: actorFetching } = useActor();
  const [data, setData] = useState<string>("{}");
  const [isLoading, setIsLoading] = useState(true);
  const inFlight = useRef(false);

  const fetchOrders = useCallback(async () => {
    if (inFlight.current) return;
    if (!actor || actorFetching) return;
    inFlight.current = true;
    try {
      const result = await actor.getOrders();
      setData(result);
    } catch {
      // silently ignore transient errors
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [actor, actorFetching]);

  useEffect(() => {
    if (!actor || actorFetching) return;
    fetchOrders();
    const id = setInterval(fetchOrders, 2_000);
    return () => clearInterval(id);
  }, [fetchOrders, actor, actorFetching]);

  return { data, isLoading, refetch: fetchOrders };
}

// ─── Legacy orders hook ───────────────────────────────────────────────────────

export function useGetOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return "{}";
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2_000,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      exchange,
      token,
      transactionType,
      orderType,
      quantity,
      price,
      product,
    }: {
      symbol: string;
      exchange: string;
      token: string;
      transactionType: string;
      orderType: string;
      quantity: number;
      price: number;
      product: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.placeOrder(
        symbol,
        exchange,
        token,
        transactionType,
        orderType,
        BigInt(quantity),
        price,
        product,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useCancelOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.cancelOrder(orderId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ─── Holdings / Portfolio ─────────────────────────────────────────────────────

export function useGetHoldings() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["holdings"],
    queryFn: async () => {
      if (!actor) return "{}";
      return actor.getHoldings();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Realtime Positions — 2 second polling with fetch-guard ──────────────────

export function useRealtimePositions() {
  const { actor, isFetching: actorFetching } = useActor();
  const [data, setData] = useState<string>("{}");
  const [isLoading, setIsLoading] = useState(true);
  const inFlight = useRef(false);

  const fetchPositions = useCallback(async () => {
    if (inFlight.current) return;
    if (!actor || actorFetching) return;
    inFlight.current = true;
    try {
      const result = await actor.getPositions();
      setData(result);
    } catch {
      // silently ignore transient errors
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [actor, actorFetching]);

  useEffect(() => {
    if (!actor || actorFetching) return;
    fetchPositions();
    const id = setInterval(fetchPositions, 2_000);
    return () => clearInterval(id);
  }, [fetchPositions, actor, actorFetching]);

  return { data, isLoading, refetch: fetchPositions };
}

// ─── Legacy positions hook ────────────────────────────────────────────────────

export function useGetPositions() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["positions"],
    queryFn: async () => {
      if (!actor) return "{}";
      return actor.getPositions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 2_000,
  });
}

// ─── Market Depth — 1 second polling with fetch-guard ────────────────────────

export function useGetMarketDepth(exchange: string, token: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["depth", exchange, token],
    queryFn: async () => {
      if (!actor || !exchange || !token) return "{}";
      return actor.getMarketDepth(exchange, token);
    },
    enabled: !!actor && !isFetching && !!exchange && !!token,
    refetchInterval: 1_000,
  });
}
