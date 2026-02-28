import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Session {
    consumerSecret: string;
    mobileNumber: string;
    consumerKey: string;
    sessionToken?: string;
    accessToken?: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface SymbolInfo {
    token: string;
    instrumentName: string;
    exchange: string;
    symbol: string;
}
export interface InstrumentToken {
    token: string;
    exchange: string;
}
export interface UserProfile {
    name: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addToWatchlist(symbol: string, exchange: string, token: string, instrumentName: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelOrder(orderId: string): Promise<string>;
    clearSession(): Promise<void>;
    completeLogin(otp: string, password: string): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHoldings(): Promise<string>;
    getMarketDepth(exchange: string, token: string): Promise<string>;
    getOrders(): Promise<string>;
    getPositions(): Promise<string>;
    getQuotes(instrumentTokens: Array<InstrumentToken>): Promise<string>;
    getSession(): Promise<Session | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWatchlist(): Promise<Array<SymbolInfo>>;
    initiateLogin(consumerKey: string, consumerSecret: string, mobileNumber: string): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(symbol: string, exchange: string, token: string, transactionType: string, orderType: string, quantity: bigint, price: number, product: string): Promise<string>;
    removeFromWatchlist(symbol: string, exchange: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCredentials(consumerKey: string, consumerSecret: string, mobileNumber: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
