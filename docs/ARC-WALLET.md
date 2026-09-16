# Arc wallet observations

The Arc workspace supports Arc Mainnet (5042) and Testnet (5042002), using the RPC and explorer addresses published in [Arc connection documentation](https://docs.arc.io/arc/references/connect-to-arc).

Connect an injected browser wallet to share its selected address, or enter a public address without connecting. Network switching requests the selected official network and verifies the wallet response. Account changes, network changes, and disconnects clear observations that belonged to the previous wallet context.

## One USDC balance

The workspace reads the native USDC balance at a reported block with 18-decimal native precision. Arc's ERC-20 USDC interface represents the same funds; it is not added as a second balance. Mainnet observations are never reused for testnet.

## Gas estimates

Enter a recipient and USDC amount to simulate a native transfer with `eth_estimateGas`. The estimate combines gas units with `eth_gasPrice`, shows the fee and amount plus fee in USDC, and compares that total with the sender's observed balance. A quote is not reserved: balances and gas prices can change before execution. The estimator never requests signing, token approval, or transaction broadcast.

## Transaction status

Paste a transaction hash to inspect its receipt. The workspace distinguishes not found, included, finalized, and failed transactions, with the actual receipt gas fee when available. Finality is checked against the RPC's finalized block. A finalized transaction is not evidence of a stock purchase, beneficial ownership, or a brokerage fill.

## Verification

Automated tests cover exact native balance and fee precision, network mismatch rejection, wallet account changes during connection, network addition and verification, refusal handling, and receipt finality. Live mainnet reads and gas simulation were checked without moving funds. This release does not implement wallet signing or execution.
