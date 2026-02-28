import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type MarketDepthRequest = {
    exchange : Text;
    token : Text;
  };

  public type SymbolInfo = {
    symbol : Text;
    exchange : Text;
    token : Text;
    instrumentName : Text;
  };

  public type Session = {
    consumerKey : Text;
    consumerSecret : Text;
    mobileNumber : Text;
    accessToken : ?Text;
    sessionToken : ?Text;
  };

  public type OrderRequest = {
    symbol : Text;
    exchange : Text;
    token : Text;
    transactionType : Text;
    orderType : Text;
    quantity : Nat;
    price : Float;
    product : Text;
  };

  public type InstrumentToken = {
    exchange : Text;
    token : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let sessions = Map.empty<Principal, Session>();
  let watchlists = Map.empty<Principal, List.List<SymbolInfo>>();
  let kotakNeoBaseUrl = "https://gw-napi.kotaksecurities.com";

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Session Management
  public query ({ caller }) func getSession() : async ?Session {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access sessions");
    };
    sessions.get(caller);
  };

  public shared ({ caller }) func saveCredentials(
    consumerKey : Text,
    consumerSecret : Text,
    mobileNumber : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save credentials");
    };
    let session : Session = {
      consumerKey;
      consumerSecret;
      mobileNumber;
      accessToken = null;
      sessionToken = null;
    };
    sessions.add(caller, session);
  };

  public shared ({ caller }) func clearSession() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear sessions");
    };
    sessions.remove(caller);
  };

  func ensureSession(caller : Principal) : Session {
    switch (sessions.get(caller)) {
      case (null) { Runtime.trap("No session found. Please save credentials first.") };
      case (?session) { session };
    };
  };

  // Watchlist Management
  public shared ({ caller }) func addToWatchlist(symbol : Text, exchange : Text, token : Text, instrumentName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify watchlist");
    };
    let watchlist = switch (watchlists.get(caller)) {
      case (null) { List.empty<SymbolInfo>() };
      case (?list) { list };
    };

    let newSymbol : SymbolInfo = {
      symbol;
      exchange;
      token;
      instrumentName;
    };

    let exists = watchlist.any(
      func(item) {
        item.symbol == symbol and item.exchange == exchange
      }
    );

    if (exists) {
      Runtime.trap("Symbol already exists in watchlist");
    };

    watchlist.add(newSymbol);
    watchlists.add(caller, watchlist);
  };

  public shared ({ caller }) func removeFromWatchlist(symbol : Text, exchange : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify watchlist");
    };
    switch (watchlists.get(caller)) {
      case (null) { Runtime.trap("Symbol not found in watchlist: " # symbol) };
      case (?watchlist) {
        let newList = watchlist.filter(
          func(item) {
            not (item.symbol == symbol and item.exchange == exchange);
          }
        );
        if (newList.size() == watchlist.size()) {
          Runtime.trap("Symbol not found in watchlist: " # symbol);
        };
        watchlists.add(caller, newList);
      };
    };
  };

  public query ({ caller }) func getWatchlist() : async [SymbolInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watchlist");
    };
    switch (watchlists.get(caller)) {
      case (null) { [] };
      case (?watchlist) {
        watchlist.toArray();
      };
    };
  };

  // HTTP outcall transformation helper (public for IC system callback)
  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Authentication with Kotak Neo
  public shared ({ caller }) func initiateLogin(consumerKey : Text, consumerSecret : Text, mobileNumber : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initiate login");
    };
    let body = "{" #
      "\"consumerKey\":\"" # consumerKey # "\"," #
      "\"consumerSecret\":\"" # consumerSecret # "\"," #
      "\"mobileNumber\":\"" # mobileNumber # "\"" #
      "}";
    let url = kotakNeoBaseUrl # "/api/v1/initiateLogin";
    await OutCall.httpPostRequest(url, [], body, transform);
  };

  public shared ({ caller }) func completeLogin(otp : Text, password : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete login");
    };
    let session = ensureSession(caller);
    let body = "{" #
      "\"consumerKey\":\"" # session.consumerKey # "\"," #
      "\"consumerSecret\":\"" # session.consumerSecret # "\"," #
      "\"mobileNumber\":\"" # session.mobileNumber # "\"," #
      "\"otp\":\"" # otp # "\"," #
      "\"password\":\"" # password # "\"" #
      "}";
    let url = kotakNeoBaseUrl # "/api/v1/completeLogin";
    let response = await OutCall.httpPostRequest(url, [], body, transform);

    let updatedSession : Session = {
      session with
      accessToken = ?response;
    };
    sessions.add(caller, updatedSession);

    response;
  };

  func buildHeaders(accessToken : Text, sessionToken : Text) : [OutCall.Header] {
    [
      { name = "Authorization"; value = "Bearer " # accessToken },
      { name = "sid"; value = sessionToken },
      { name = "x-api-version"; value = "cat" },
    ];
  };

  // Market Data
  public shared ({ caller }) func getQuotes(instrumentTokens : [InstrumentToken]) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get quotes");
    };
    let session = ensureSession(caller);
    let accessToken = switch (session.accessToken) {
      case (null) { Runtime.trap("Login required. Access token missing."); };
      case (?token) { token };
    };
    let sessionToken = switch (session.sessionToken) {
      case (null) { Runtime.trap("Login required. Session token missing."); };
      case (?token) { token };
    };

    let tokensParam = instrumentTokens.map(
      func(instToken) {
        "{" #
        "\"exchange\":\"" # instToken.exchange # "\"," #
        "\"token\":\"" # instToken.token # "\"" #
        "}";
      }
    );

    let body = "{\"instruments\": [" # tokensParam.values().join(",") # "]}";
    let url = kotakNeoBaseUrl # "/api/v1/market/quotes";
    await OutCall.httpPostRequest(url, buildHeaders(accessToken, sessionToken), body, transform);
  };

  public shared ({ caller }) func getMarketDepth(exchange : Text, token : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get market depth");
    };
    let session = ensureSession(caller);
    let accessToken = switch (session.accessToken) {
      case (null) { Runtime.trap("Login required. Access token missing."); };
      case (?token) { token };
    };
    let sessionToken = switch (session.sessionToken) {
      case (null) { Runtime.trap("Login required. Session token missing."); };
      case (?token) { token };
    };

    let body = "{" #
      "\"exchange\":\"" # exchange # "\"," #
      "\"token\":\"" # token # "\"" #
      "}";

    let url = kotakNeoBaseUrl # "/api/v1/market/marketdepth";
    await OutCall.httpPostRequest(url, buildHeaders(accessToken, sessionToken), body, transform);
  };

  // Order Management
  public shared ({ caller }) func placeOrder(symbol : Text, exchange : Text, token : Text, transactionType : Text, orderType : Text, quantity : Nat, price : Float, product : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    let session = ensureSession(caller);
    let accessToken = switch (session.accessToken) {
      case (null) { Runtime.trap("Login required. Access token missing."); };
      case (?token) { token };
    };
    let sessionToken = switch (session.sessionToken) {
      case (null) { Runtime.trap("Login required. Session token missing."); };
      case (?token) { token };
    };

    let body = "{" #
      "\"exchange\":\"" # exchange # "\"," #
      "\"segment\":\"nse_cm\"," #
      "\"symbol\":\"" # symbol # "\"," #
      "\"instrumentToken\":\"" # token # "\"," #
      "\"transactionType\":\"" # transactionType # "\"," #
      "\"quantity\":" # quantity.toText() # "," #
      "\"orderType\":\"" # orderType # "\"," #
      "\"validity\":\"day\"," #
      "\"price\":" # price.toText() # "," #
      "\"product\":\"" # product # "\"" #
      "}";

    let url = kotakNeoBaseUrl # "/api/v1/placeOrder";
    await OutCall.httpPostRequest(url, buildHeaders(accessToken, sessionToken), body, transform);
  };

  public shared ({ caller }) func cancelOrder(orderId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel orders");
    };
    let session = ensureSession(caller);
    let accessToken = switch (session.accessToken) {
      case (null) { Runtime.trap("Login required. Access token missing."); };
      case (?token) { token };
    };
    let sessionToken = switch (session.sessionToken) {
      case (null) { Runtime.trap("Login required. Session token missing."); };
      case (?token) { token };
    };

    let body = "{" #
      "\"orderId\":\"" # orderId # "\"" #
      "}";
    let url = kotakNeoBaseUrl # "/api/v1/cancelOrder";
    await OutCall.httpPostRequest(url, buildHeaders(accessToken, sessionToken), body, transform);
  };

  public shared ({ caller }) func getOrders() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    let session = ensureSession(caller);
    let accessToken = switch (session.accessToken) {
      case (null) { Runtime.trap("Login required. Access token missing."); };
      case (?token) { token };
    };
    let sessionToken = switch (session.sessionToken) {
      case (null) { Runtime.trap("Login required. Session token missing."); };
      case (?token) { token };
    };

    let url = kotakNeoBaseUrl # "/api/v1/orders";
    await OutCall.httpGetRequest(url, buildHeaders(accessToken, sessionToken), transform);
  };

  public shared ({ caller }) func getHoldings() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view holdings");
    };
    let session = ensureSession(caller);
    let accessToken = switch (session.accessToken) {
      case (null) { Runtime.trap("Login required. Access token missing."); };
      case (?token) { token };
    };
    let sessionToken = switch (session.sessionToken) {
      case (null) { Runtime.trap("Login required. Session token missing."); };
      case (?token) { token };
    };

    let url = kotakNeoBaseUrl # "/api/v1/holdings";
    await OutCall.httpGetRequest(url, buildHeaders(accessToken, sessionToken), transform);
  };

  public shared ({ caller }) func getPositions() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view positions");
    };
    let session = ensureSession(caller);
    let accessToken = switch (session.accessToken) {
      case (null) { Runtime.trap("Login required. Access token missing."); };
      case (?token) { token };
    };
    let sessionToken = switch (session.sessionToken) {
      case (null) { Runtime.trap("Login required. Session token missing."); };
      case (?token) { token };
    };

    let url = kotakNeoBaseUrl # "/api/v1/positions";
    await OutCall.httpGetRequest(url, buildHeaders(accessToken, sessionToken), transform);
  };
};
