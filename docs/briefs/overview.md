# ARCWELL project overview

The paper investing MVP for customers and investors

September 2026 · Research prototype

ARCWELL is a focused paper-investing workspace. Its MVP lets users discover sample assets, inspect price behavior, practice buying and selling, and follow the result in a connected portfolio and activity history.

Five views keep the experience easy to understand: Portfolio, Markets, Trade, Activity, and Settings. Interactive charts, a visual market map, and clear order review bring the core investing journey into one interface. Visitors can begin without creating an account or connecting a wallet.

![The MVP portfolio. Prices, holdings, and historical charts use synthetic sample data.](../assets/mvp-portfolio.jpg)

## A complete practice loop

Find an instrument in Markets, review a paper order in Trade, then see holdings, cash, and activity update. The account persists in the same browser when storage is available. Exports give users a copy of the account or selected records.

## The customer value

The MVP helps people understand the relationship between an investment decision and a portfolio. A user can compare sample assets, rehearse a position change, and inspect the resulting allocation without moving real money. An educator or prospective partner can use the same workflow for a repeatable demonstration.

| MVP view  | What the user can do                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| Portfolio | Inspect holdings, cash, allocation, history, and concentration explanations.       |
| Markets   | Search and filter 16 sample instruments; compare return, volatility, and drawdown. |
| Trade     | Inspect candles and indicators; review and confirm a simulated buy or sell.        |
| Activity  | Review paper fills, filter activity, inspect cash history, and export CSV.         |
| Settings  | Export the account as JSON, confirm a reset, and inspect product limits.           |

## Why the implementation matters

All investing views use the same paper-account model. An accepted order updates cash, holdings, and the activity ledger together. Invalid orders fail before state changes. Seeded sample histories keep demonstrations reproducible, and the source makes calculation assumptions available for review.

The browser runs the simulation and saves the practice account locally; the web server delivers the interface. This reduces setup for the beta and makes the core workflow available without a customer-account service. Local storage is device-specific and is not a secure financial ledger.

## What this MVP establishes

For investors, the release demonstrates a functional product journey and a concrete implementation. It does not establish customer traction, recurring revenue, product-market fit, or a production investing service. Useful evaluation criteria include whether a new user can complete the workflow, understand what changed, and correctly distinguish sample data from live investment activity.

## The release boundary

The beta uses synthetic prices and fixed-price paper fills. No brokerage, wallet signing, deposits, withdrawals, or real execution is connected. Familiar symbols are illustrative rather than supported token listings. Portfolio history reconstructs today's quantities across sample prices; it does not report realized account performance.

[Explore ARCWELL](https://arcwellfi.com) · [Open the source](https://github.com/ArcwellLabs/arcwell-public) · [Follow ARCWELL](https://x.com/ARCWELLFI)

Implementation references: frontend/src/lib/dashboard-release.ts; frontend/src/pages/Dashboard.tsx; frontend/src/lib/quant.ts; frontend/src/pages/dashboard/MvpSettings.tsx. Scope: the five-view MVP, September 2026. ARCWELL is independent software with no implied Arc or Circle endorsement.
