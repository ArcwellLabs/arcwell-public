# Arc token swaps through Uniswap

The Swap view prepares an Arc Mainnet token exchange and opens the official Uniswap app. It follows Uniswap's [custom interface links](https://developers.uniswap.org/docs/trading/custom-interface-links). Arc is listed in its [supported chains](https://developers.uniswap.org/docs/trading/swapping-api/supported-chains). This release uses the documented external handoff; embedding the app requires Uniswap's origin approval.

## Customer flow

1. Open Swap and inspect EURC, or paste another mainnet token contract.
2. Choose USDC into the token or the reverse and enter the input amount.
3. Review the network, exact input/output contracts, and provider destination.
4. Continue to `app.uniswap.org`, where the provider obtains the quote and the user reviews output, slippage, fees, and approvals before authorizing with their wallet.
5. After an external transaction, copy its hash into the Arc workspace to inspect its receipt and finality.

No transaction is submitted by reviewing or opening the link. Provider availability, route liquidity, wallet balance and token permissions determine whether a swap can proceed. The handoff does not create a paper fill, record a confirmed order, or automatically import external transactions.

## Identity and amount checks

The selected asset must have a successful Arc Mainnet contract read and valid token precision. The USDC side uses Arc's published ERC-20 interface, with six-decimal token amounts. Native wallet balances and gas observations remain in their separate eighteen-decimal native units. Exact decimal strings are retained; amounts never pass through floating-point arithmetic. Testnet, invalid contracts, unsupported precision, zero amounts, overflows, and exchanging USDC into itself are rejected.

The destination is fixed to the official Uniswap origin and swap path. Callers cannot supply a recipient, arbitrary redirect, spender, or approval payload. Changing the input amount, direction, or selected token clears the prior review. USYC is excluded from this public route because it requires issuer eligibility and allowlisting; arbitrary token symbols do not establish backing or eligibility.

## Verification and scope

On September 16, 2026, browser verification confirmed that the official app accepted Arc's published USDC and EURC contracts and a one-USDC input, then returned an EURC quote. Form and domain checks cover exact parameter binding, direction changes, invalid amounts, precision, chain restrictions, contract checks, and the fixed destination. No wallet was connected and no funded swap was executed during verification.

This is a functional external token swap handoff, not an issuer or brokerage integration for real stocks. The Trade view remains paper investing. Customer access controls, issuer relationships, stock execution and automated order reconciliation are separate work.
