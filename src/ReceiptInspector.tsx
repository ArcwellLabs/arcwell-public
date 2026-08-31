import { useState } from 'react';
import type { FormEvent } from 'react';
import { ARC, readReceipt } from './arc';
import type { ReceiptObservation } from './arc';

const LABELS = {
  'not-found': 'No receipt found',
  included: 'Included · finality unverified',
  finalized: 'Successful · finalized',
  failed: 'Execution failed',
};

export function ReceiptInspector() {
  const [hash, setHash] = useState('');
  const [result, setResult] = useState<ReceiptObservation | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setError('');
    try {
      setResult(await readReceipt(hash.trim()));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Receipt lookup failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel balance-panel">
      <p className="eyebrow">ONCHAIN RECEIPTS</p>
      <h2>Inspect a transaction.</h2>
      <p>
        Read a public Arc Testnet receipt, reconcile its block, and check finality. The hash is sent
        to Arc’s RPC.
      </p>
      <form onSubmit={submit}>
        <label htmlFor="transaction-hash">Transaction hash</label>
        <div className="inline-form">
          <input
            id="transaction-hash"
            value={hash}
            disabled={busy}
            onChange={(event) => {
              setHash(event.target.value);
              setResult(null);
              setError('');
            }}
            placeholder="0x… (64 hexadecimal characters)"
            autoComplete="off"
            required
          />
          <button className="button primary" disabled={busy}>
            {busy ? 'Inspecting…' : 'Inspect receipt'}
          </button>
        </div>
      </form>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="result" role="status">
          <strong>{LABELS[result.state]}</strong>
          {result.state === 'not-found' ? (
            <p>The transaction may be pending, unknown, or unavailable from this endpoint.</p>
          ) : (
            <>
              <p>
                Block {result.block} · Network fee {result.gasFeeUsdc} USDC
              </p>
              <p>Finality: {result.finality}. Execution status is distinct from block finality.</p>
              <a
                className="text-link"
                href={`${ARC.explorerUrl}/tx/${result.hash}`}
                target="_blank"
                rel="noreferrer"
              >
                Open on Arcscan ↗
              </a>
            </>
          )}
          <small>
            Observed {new Date(result.observedAt).toLocaleString()}. RPC observation, not
            independent cryptographic proof or confirmation of a specific asset transfer.
          </small>
        </div>
      ) : null}
    </section>
  );
}
