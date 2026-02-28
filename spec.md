# InstaTrader - Kotak Neo Style Trading App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- **Trading Dashboard**: Market watchlist with real-time stock quotes (polled via Kotak Neo API)
- **Order Placement**: Buy/Sell orders (market, limit, stop-loss) via Kotak Neo API
- **Portfolio View**: Holdings, positions, P&L summary
- **Order Book**: Open orders, executed orders, order history
- **Market Depth (Level 2)**: Bid/ask depth for selected instruments
- **Search & Add Instruments**: Search stocks/F&O/indices to watchlist
- **Authentication**: Login with Kotak Neo API credentials (consumer key, consumer secret, mobile number, OTP flow)
- **Charts**: Basic intraday price chart using polled OHLC data

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan

### Backend (Motoko)
1. Store Kotak Neo API credentials and session tokens per user (consumer_key, consumer_secret, access_token, session_token)
2. HTTP outcall functions:
   - `loginStep1(mobileNumber, consumerKey, consumerSecret)` -- initiates OTP via Kotak Neo API
   - `loginStep2(otp, password)` -- completes OTP verification, returns session token
   - `getQuote(instruments: [Text])` -- polls live market quotes
   - `getMarketDepth(instrument: Text)` -- fetches bid/ask depth
   - `placeOrder(orderParams)` -- places buy/sell order
   - `getOrders()` -- fetch open/executed orders
   - `cancelOrder(orderId)` -- cancel an open order
   - `getHoldings()` -- fetch portfolio holdings
   - `getPositions()` -- fetch intraday positions
3. Watchlist management stored on-chain per user (add/remove instruments)
4. Authorization component to gate all trading calls

### Frontend (React)
1. Login screen with Kotak Neo credential entry + OTP flow
2. Main layout with sidebar navigation: Watchlist, Portfolio, Orders, Positions
3. Watchlist page: live quote table (LTP, change %, volume), add/remove instruments
4. Order placement modal/panel: Buy/Sell, quantity, price, order type (Market/Limit/SL)
5. Order book page: tabs for Open, Executed, All orders with cancel action
6. Portfolio page: Holdings table with avg cost, current value, P&L
7. Positions page: intraday MTM positions
8. Market depth panel for selected stock
9. Auto-refresh quotes every 5 seconds
