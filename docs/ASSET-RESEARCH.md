# Arc asset research

Markets uses a read-only server endpoint at `/api/assets`. Search accepts a token
name, symbol, or full EVM contract address, with an explicit Arc Mainnet/Testnet
selector. It does not require a wallet or account. Trade and Portfolio remain
separate paper simulations using sample instruments.

## Coverage and sources

- Mainnet name/symbol discovery combines GeckoTerminal, DEX Screener, and the Arc
  explorer when reachable. GeckoTerminal results support up to ten search pages.
- Testnet discovery uses the testnet explorer. Testnet assets never inherit
  mainnet prices, liquidity, or charts.
- Address lookup reads deployed bytecode and available token metadata through
  Arc RPC, including contracts absent from market indexes. Chain ID is checked
  first; bytecode and token calls use one pinned block. Nonstandard contracts may
  omit metadata. ERC-721/1155 collection discovery depends on explorer coverage;
  individual NFT valuation is not supplied.
- Mainnet pool observations include contract-matched prices, pool liquidity,
  pool volume, and available price changes. Holder counts and descriptions come
  from the GeckoTerminal profile or explorer and identify their source.
- Daily OHLCV uses the requested token's USD denomination, not the other side of
  the pool. Up to three liquid pools are tried when history is unavailable or has
  fewer than two observations. No interpolated or synthetic history is added.
- USDC, EURC, and USYC reference identities come from
  [Arc's contract documentation](https://docs.arc.io/arc/references/contract-addresses),
  reviewed September 16, 2026. These references supplement live discovery and do
  not supply prices. USYC issuer NAV and redemption quotes are not connected.

Name search is bounded by provider indexing and search ranking. A missing name
match does not establish that an asset does not exist: use its contract address.
There is no promise of complete pricing for every token. Provider outages,
unindexed tokens, illiquid markets, and unavailable history are shown explicitly.
Arc's mainnet explorer API returned HTTP 403 during initial integration testing;
RPC and both mainnet market providers returned live data successfully.

## Data quality boundaries

Network and contract address identify an asset. A ticker alone does not. Search
retains separate contracts with identical names/symbols and merges observations
only for the same address on the same network. Arc reference contracts rank first.
Descriptions and indexer names are unverified provider claims, rendered as text.
External source links are built from fixed provider hosts and validated addresses;
arbitrary URLs from provider metadata are not rendered.

The headline price uses the most liquid returned pool with a positive price and
liquidity. DEX quote-token prices are derived from the provider's USD base price
and base/quote ratio; base-token percentage changes are not applied to the quote.
The interface flags liquidity below $10,000 and cross-provider price differences
above 5%. These are heuristics, not an asset safety rating. Different providers
can report different volumes and liquidity for the same pool, so rows are never
summed. Market cap and fund NAV are not inferred from token supply.

Every response carries retrieval times. These are not provider publication times.
The UI flags snapshots older than two minutes and offers refresh. A refresh can
reuse the server's cache for up to 60 seconds. Holder update time is separate when
provided. The current daily candle can be incomplete. Prices are informational
observations, not executable trading quotes.

## Operation and limits

No API keys, paid subscriptions, database, or new hosting service are required.
The existing Node server keeps at most 100 cached responses for 60 seconds,
coalesces concurrent identical requests, allows six concurrent lookups and twelve
uncached requests per minute per process, and bounds provider responses to 2 MB.
GeckoTerminal requests are capped at 27/minute per process, other indexer requests
at 100/minute, and RPC requests at 240/minute. Each upstream request times out
after eight seconds. Limits fail closed; the API returns 429 when its admission
limit is reached and provider failures become visible availability states.

These are application safeguards, not a billing cap or distributed rate limiter.
Multiple replicas multiply these budgets. Review traffic and provider terms before
scaling beyond the current single replica; do not silently subscribe to a paid API.

Provider references:
[DEX Screener](https://docs.dexscreener.com/api/reference),
[GeckoTerminal](https://api.geckoterminal.com/docs/index.html),
[Blockscout](https://docs.blockscout.com/devs/apis/rest), and
[Arc RPC](https://docs.arc.io/arc/references/connect-to-arc).

`tests/asset-data.test.ts` covers identity, base/quote orientation, malformed
responses, arbitrary contract metadata, chain checks, testnet separation, outages,
input validation, caching, and request admission. Run `npm run verify` with
`NITRO_PRESET=node-server` before publication.

## Provider outages and retained history

Source availability distinguishes upstream HTTP errors, rate limits, local provider budgets, timeouts, missing endpoints, and invalid data. Retry times are displayed when available. Upstream response bodies are never exposed. HTTP 429 responses establish a bounded provider cooldown, preventing immediate repeat requests during that window.

Verified, token-matched daily candles are cached for five minutes. If a refresh fails, the last verified history can remain visible for at most one hour, labeled as stale with its original retrieval time. This fallback applies only to historical candles, never to the displayed current price. Caches are bounded, process-local, and cleared on restart. An address confirmed to have no deployed contract cannot inherit cached history; mainnet and testnet caches are separate.

Live checks on September 16, 2026 returned onchain metadata and market observations for USDC and EURC, with three and thirty daily candles respectively. USYC contract metadata was readable, but no liquid market price or history was returned. Those are point-in-time coverage observations, not guarantees. The explorer API was unavailable while other sources responded; the interface continued to show their independent observations.
