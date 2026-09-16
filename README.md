<p align="center">
  <img src="docs/assets/arcwell-banner.png" alt="ARCWELL — Proof for real-world transactions" width="100%" />
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: PolyForm Noncommercial 1.0.0" src="https://img.shields.io/badge/license-PolyForm_Noncommercial_1.0.0-silver?style=flat-square&labelColor=111111" /></a>
  <a href="https://github.com/ArcwellLabs/arcwell-public/actions/workflows/ci.yml"><img alt="Verify ARCWELL" src="https://github.com/ArcwellLabs/arcwell-public/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="Status: research prototype" src="https://img.shields.io/badge/status-research_prototype-737373?style=flat-square&labelColor=111111" />
  <a href="https://x.com/ARCWELLFI"><img alt="X: ARCWELLFI" src="https://img.shields.io/badge/X-ARCWELLFI-white?style=flat-square&labelColor=111111" /></a>
</p>

# ARCWELL

A research workspace for paper investing and portfolio exploration, with
additional quantitative and Arc Testnet modules retained in the source. Built around a simple ambition: make asset records,
operating boundaries, and settlement evidence easier to inspect.

**This release is a prototype.** Prices, portfolios, records, verifier scores, and
marketing examples are illustrative. Paper orders use simulated funds. The app
cannot execute trades, sign transactions, hold assets, or verify issuer reserves.
It is independent software with no implied affiliation or endorsement by Arc or Circle.

[Get started](#run-locally) · [Capabilities](#explore-the-workspace) ·
[Contributing](CONTRIBUTING.md) · [Privacy controls](docs/IDENTITY.md) ·
[Release history](docs/HISTORY.md) · [Updates on X](https://x.com/ARCWELLFI)

## Explore the workspace

| Workspace | What you can do                                             |
| --------- | ----------------------------------------------------------- |
| Portfolio | Inspect simulated holdings, balances, and allocations.      |
| Markets   | Explore illustrative stocks and funds.                      |
| Trade     | Place browser-local paper orders using simulated funds.     |
| Activity  | Review simulated orders and export activity.                |
| Settings  | Inspect the local paper-account settings and data controls. |

The current beta exposes these five views. Advanced quantitative models, funding,
evidence-registry interfaces, and Arc Testnet panels remain in the codebase behind
release flags. Hidden dashboard deep links return to the supported beta views.

Paper-account data stays in the browser and is not synchronized across devices.
The beta does not move real funds, broadcast transactions, or execute brokerage orders.

## Run locally

Use Node.js 22.18 or later and npm. No API key, wallet, database, or paid service is
required for local use.

```sh
git clone https://github.com/ArcwellLabs/arcwell-public.git
cd arcwell-public
npm run setup
npm run identity:setup
npm run dev
```

Open [localhost:5180](http://localhost:5180). The React 19 / TanStack Start frontend
is the primary application. An earlier React 18 interface is available through
`npm run dev:starter`.

```sh
npm run verify          # formatting, domain tests, TypeScript, production build
npm run identity:check  # identities and content across the complete Git history
npm run privacy:check   # current identity and every staged file
npm run preview        # production preview
```

## Project structure

| Path                                 | Responsibility                                                    |
| ------------------------------------ | ----------------------------------------------------------------- |
| `frontend/src/pages/dashboard/`      | Investing workspace, charts, registry, and Arc panels             |
| `frontend/src/lib/quant.ts`          | Illustrative market data and quantitative calculations            |
| `frontend/src/hooks/usePaperBook.ts` | Browser-local paper-account state                                 |
| `src/arc.ts`                         | Arc Testnet configuration, exact amount arithmetic, and RPC reads |
| `tests/`                             | Domain behavior and privacy-guard regression coverage             |
| `scripts/`                           | Repository identity setup and publication checks                  |

## Network boundaries

The code targets **Arc Testnet**, chain ID `5042002`, using
`https://rpc.testnet.arc.io`. Mainnet execution, live market data, wallet signing,
brokerage access, bridging, and issuer integrations are not implemented in this release.

The native USDC balance and its ERC-20 interface represent the same funds with
different decimal scales. The shared Arc module keeps those scales explicit.
See the [Arc connection documentation](https://docs.arc.io/integrate/connect-to-arc)
for network information; the configuration in this repository is intentionally
specific to its testnet implementation.

## License

ARCWELL's original code and documentation are provided under the
[PolyForm Noncommercial License 1.0.0](LICENSE), with the required notice in [NOTICE](NOTICE).
The license permits the noncommercial purposes it defines. Commercial use requires
separate permission from the relevant rights holder.

This is **source-available software**. Third-party packages and incorporated
components retain their own licenses; see [third-party notices](THIRD_PARTY_NOTICES.md).
Public source access does not imply permission to represent an official ARCWELL service.
