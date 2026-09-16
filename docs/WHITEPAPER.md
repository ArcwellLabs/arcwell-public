# ARCWELL whitepaper

Product architecture and delivery roadmap

September 16, 2026 · Version 1.0

ARCWELL is developing a connected workspace for asset discovery, investing and portfolio understanding on Arc. Its current foundation combines live network research, wallet observations and an external token-swap handoff with a separate browser-local paper account. The roadmap extends that foundation into provider-backed investing, richer portfolio analysis and advanced research. Each expansion depends on explicit release criteria.

## The product thesis

An investing decision crosses several different systems: asset information, the account, the execution venue and the record of what happened. Users need to understand how those systems relate. A polished chart alone cannot establish the identity of an asset, the terms of access, the outcome of an order or the meaning of a portfolio return.

ARCWELL's direction is to make that journey coherent: discover an asset, inspect its provenance and behavior, review an action, then follow its effect on the account. Arc provides the network context. ARCWELL provides the product interface and, as the roadmap progresses, the integrations and account services needed to connect the journey.

The initial audience is people evaluating assets and learning the workflow, followed by eligible customers of a supported investing provider. Prospective partners can evaluate the interface, implementation and integration boundaries. Institutional evidence workflows are a later, separate opportunity that depends on customer demand.

The product is intentionally staged. The working beta makes the core interaction tangible; it does not establish a live stock brokerage. This paper explains both the delivered foundation and the conditions required to extend it. It does not claim customer traction, revenue, investment performance or committed launch dates.

## The foundation today

The investing workspace centers on Portfolio, Markets, Trade, Swap, Activity, Arc and Settings. Markets has evolved beyond the original synthetic asset map to include live Arc discovery by asset name, symbol or contract. Sourced observations can include contract information and provider-supplied market data, with network context and timestamps. Available fields depend on the asset and provider; missing data remains an explicit state.

Portfolio, Trade and Activity form a separate paper-account workflow. A user can inspect sample holdings, review a simulated buy or sell, and see cash, positions and activity change together. The account is saved in the current browser when storage is available. Settings supports account export and a confirmed reset; selected records can be downloaded as CSV.

The separation matters. Searching a live token does not add it to the paper universe, establish issuer backing or enable a real purchase. Synthetic history is not a live market feed. A recognized company symbol or logo is not an affiliation or an entitlement to the underlying security.

Optional wallet connection supports verified Arc network switching, native USDC balance reads, read-only native USDC transfer gas estimates, and receipt and finality observations. Research exposes provider failures, retry states and a bounded, explicitly labeled stale-history fallback. The Swap workspace verifies Arc Mainnet token contracts and reviews the pair and input amount before opening the official Uniswap interface. Final quotes, slippage, approvals and signatures remain with that provider. ARCWELL does not sign or broadcast transactions in this flow. Token swaps do not establish stock backing or enable stock execution.

| System                | Current meaning                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Asset research        | Live Arc discovery and sourced observations; coverage and freshness vary.                   |
| Paper account         | Synthetic instruments and simulated fills stored in this browser.                           |
| Wallet and swap tools | Available: wallet observations, gas estimates, receipts and reviewed external swap handoff. |
| Connected investing   | Planned issuer- and venue-backed workflow with eligibility and reconciliation.              |

## Architecture and data flow

The application uses React 19 and TypeScript for the interface and domain logic, TanStack Start and Router for server-rendered pages and navigation, and Vite with Nitro for application delivery. Recharts and custom SVG provide interactive financial views. Tailwind CSS and Radix primitives support a consistent interface and structured controls.

Two data paths have different responsibilities. Research resolves network and asset identity, obtains available observations from RPC and market-data sources, and displays provenance and freshness. The paper path uses deterministic fixtures and local calculation functions to validate orders and update one shared account model. Neither path should silently borrow the guarantees of the other.

A paper fill is a local state transition. Validation precedes mutation: supported asset, valid quantity and precision, available cash or position. An accepted fill updates cash, holdings and the activity ledger together. The persistence hook checks saved structure before restoring the account and exposes storage problems. Local state is editable by the user and is not an authoritative financial ledger.

The planned investing backend adds authenticated accounts, provider adapters, durable order state and reconciliation workers. Secrets belong on the server. The provider must supply actual instrument access, quotes and order semantics. The frontend should present a pending state until the relevant source establishes the outcome; it must not turn a local success screen into evidence of execution.

- Application runtime → React workspace
- Research path → network and asset identity → sourced observations
- Practice path → order rules → local paper account → exports
- Planned execution path → account and eligibility → provider → reconciled order record

## Trust boundaries and operating principles

Identity comes before action. A network, contract address and provider identity must be known before data or an executable route is trusted. A name, ticker or ecosystem directory entry is insufficient to establish that an instrument is issuer-supported, eligible for a customer or available through a venue.

Observation is not execution. A balance read reports an observation at a point in time. A transaction receipt reports network execution; reconciliation with the relevant block and finality state adds context. Neither alone proves that an investment provider accepted an order, filled it or delivered the expected security. Those outcomes require provider and delivery evidence.

Estimates stay estimates. Fees, liquidity and prices can change. Quotes need bounded validity, and the user must see the final destination, amount and material terms before authorizing an action. The planned workflow must handle rejected authorization, changed accounts, network mismatch, expired quotes, partial or failed execution and repeated requests without inventing success.

Portfolio reporting must match its inputs. Current paper history applies today's quantities to synthetic prices; it is a reconstruction, not a record of realized performance. Future performance reporting needs complete cash flows, fees, distributions and relevant corporate actions, with transparent calculation methods and corrections.

Operational readiness is part of the product. Persistent investing accounts require access controls, auditability, tested recovery, monitoring and named operational responsibilities. Automated domain tests, type checks, builds and publication guards support review of the current implementation. They do not constitute an independent security audit or certify an unbuilt execution service.

## Delivery roadmap

The sequence builds on the core beta instead of exposing every workspace at once. Available describes delivered capabilities. In development describes active integration work. Planned describes intended expansions that must pass their release gates. Exploratory describes a direction that first needs customer validation.

Stages express dependencies and product priorities, not calendar commitments. Work can overlap, and scope can change as provider access, customer needs and testing results become clear. The current roadmap is reproduced below and in the interactive roadmap page.

### 01 Foundation

**Available**

A focused investing workspace pairs live Arc asset discovery with a separate paper account. Explore sourced asset information, practice a decision, and inspect what changes in your portfolio.

- Arc asset search with source links and observation timestamps
- Browser-local paper holdings, orders, and activity
- Interactive charts, account exports, and clear data labels

**Release boundary:** Keep live research and synthetic paper-account data visibly separate. A discovered token is not automatically an investable stock.

### 02 Arc connections

**Available**

Connect a wallet, verify the Arc network, inspect native USDC balances and review receipt observations. Prepare a contract-verified token pair and continue to the official Uniswap interface for a live quote and final review.

- Wallet observations, native USDC transfer gas estimates and receipt checks
- Provider failure states and explicitly labeled history fallback
- Arc Mainnet token-pair review and official Uniswap handoff

**Release boundary:** Final quotes, slippage, approvals and signatures are handled by the external provider. Token swaps do not establish stock backing or stock execution.

### 03 Connected investing

**Planned**

Connect a small, genuinely supported asset catalog to persistent accounts and a provider-backed investing workflow. This stage depends on an issuer and venue that support the intended network and customers.

- Verified instruments, eligibility and provider onboarding
- Reliable prices, expiring quotes, fees and order review
- Funding, durable order history and reconciled fills

**Release boundary:** Confirm issuer and venue access, customer eligibility, custody responsibilities and failure recovery. A network receipt alone is not proof of a stock fill.

### 04 Portfolio intelligence

**Planned**

Turn account activity into a clearer understanding of progress. Add richer portfolio tools after the data and account foundations can support them reliably.

- Watchlists and user-controlled alerts
- Asset comparisons and distribution history
- Performance reporting that accounts for cash flows and fees

**Release boundary:** Use attributed, timestamped inputs and complete account history. Distinguish realized outcomes from illustrative calculations.

### 05 Advanced research

**Planned**

Release the full Risk and Quant workspaces as an advanced layer. Spatial views and scenario tools should make assumptions easier to inspect, while keeping the core investing journey focused.

- Dedicated risk and portfolio stress views
- 3D and 4D research explorers and option surfaces
- Allocation experiments and pairs research tools

**Release boundary:** Validate models, expose assumptions and limitations, and test usability before enabling the advanced workspaces. Models are not predictions or return guarantees.

### 06 Institutional tools

**Exploratory**

Explore evidence workflows and APIs where customer demand justifies them. This is a separate institutional direction, shaped by real partner needs rather than additional tabs in the retail workspace.

- Permissioned evidence and review workflows
- Traceable corrections and access boundaries
- Scoped APIs for validated institutional use cases

**Release boundary:** Validate customer demand, authorization boundaries and the review model first. An onchain fingerprint verifies a match, not the truth of an underlying claim.

## Release criteria and evaluation

A release should prove an end-to-end customer outcome. For the current beta, a user should be able to find an asset, distinguish live observations from synthetic account data, complete a paper order, inspect the resulting holding and locate its activity record. Exports and reset must behave as described, and unavailable data must not resemble a zero balance or successful action.

For connected investing, the acceptance path is broader: an eligible customer obtains access to a supported instrument, reviews a valid quote and its fees, authorizes the intended action, and can recover the order's reconciled state after refresh or a service interruption. Duplicate requests must not create duplicate orders. Provider fills, delivery records and network observations must remain distinguishable.

For portfolio intelligence, evaluation centers on data completeness and interpretability. A user should understand why account value changed, how a distribution or fee affected performance, and whether a comparison uses like-for-like periods. For advanced research, evaluation includes model benchmarks, reproducibility, sensitivity to assumptions and usable explanations.

The institutional direction requires evidence of a customer problem before product expansion. Evidence permissions, reviewer accountability and correction history need a defined operating model. A matching file fingerprint establishes a match to a recorded commitment; the truth of the underlying claim still requires an appropriate review process.

Infrastructure should grow with these requirements. Prefer suitable included or Free service capacity where provider terms, limits and reliability fit. Persistent customer records may require paid capacity, recovery features or operational support. This paper does not establish a provider cost forecast or a service-level commitment. Commercial model, pricing and partner economics remain decisions for product validation.

## Scope and references

This is a product and technical whitepaper, version 1.0, dated September 16, 2026. It describes a release baseline and a forward-looking development direction. Provider availability, network support and product status can change. Release announcements and the application should identify what is actually available at the time of use.

ARCWELL is independent software. References to Arc, Uniswap and other services identify technologies or integration destinations; they do not imply affiliation, endorsement, a commercial agreement or access to an issuer's investment products. No token issuance, token sale or token economics are proposed by this paper.

The public source is available under PolyForm Noncommercial 1.0.0, subject to its terms and third-party notices. Commercial use of covered material requires the applicable permission. The technical discussion is supported by the public implementation and the official references below.

- [ARCWELL public implementation and license](https://github.com/ArcwellLabs/arcwell-public)
- [ARCWELL interactive roadmap](https://arcwellfi.com/roadmap)
- [Arc official network connection reference](https://docs.arc.io/arc/references/connect-to-arc)
- [Uniswap official protocol deployments](https://developers.uniswap.org/docs/protocols/v4/deployments)
