import { ARC } from './arc'

export const INTEGRATIONS = [
  {
    name: 'CCTP',
    category: 'CROSSCHAIN USDC',
    description:
      'Track the burn, attestation, and destination mint as separate events. Surface incomplete transfers and recovery actions.',
    need: 'Next: verify supported testnet routes, implement attestation polling and destination reconciliation.',
    url: 'https://developers.circle.com/cctp',
  },
  {
    name: 'StableFX',
    category: 'STABLECOIN FX',
    description:
      'A future USDC / EURC quote-and-settlement workflow, with quote expiry, fee disclosure, and explicit user review.',
    need: 'Requires provider access, supported currency pairs, and a verified execution adapter.',
    url: 'https://developers.circle.com/stablefx',
  },
  {
    name: 'Gateway',
    category: 'UNIFIED LIQUIDITY',
    description:
      'Explore crosschain USDC balances and funding routes while keeping chain-specific settlement evidence visible.',
    need: 'Permissionless integration. Next: verify supported chains, deposit and signature flows, and withdrawal handling.',
    url: 'https://developers.circle.com/gateway',
  },
  {
    name: 'USYC',
    category: 'PERMISSIONED ASSETS',
    description:
      'Extend the asset passport with issuer evidence and a clear eligibility boundary before any subscription flow.',
    need: 'Requires current issuer eligibility review, testnet allowlisting, and product approval.',
    url: ARC.source,
  },
];

