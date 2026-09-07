import { INTEGRATIONS } from '@/lib/arc-integrations'
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ARC, ASSETS, preparePayment, readNetwork, readReceipt, readUsdcBalance } from '@/lib/arc'
import type { PaymentDraft, ReceiptObservation } from '@/lib/arc'
import { CopyButton, ExportJsonButton, FieldRow, Panel, PanelHeader, SearchInput, ViewHeader, shortHash } from './ui'

export type DraftRecord = PaymentDraft & { id: string; createdAt: string }

const buttonClass = 'inline-flex min-h-11 items-center justify-center rounded-full border border-hairline-strong bg-accent px-5 py-2 font-mono text-xs text-accent-foreground transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-50'
const inputClass = 'mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-hairline-strong bg-bg px-4 py-3 font-mono text-sm text-ink placeholder:text-faint disabled:opacity-50'
const copyClass = 'text-sm leading-relaxed text-ink-muted'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The request could not be completed.'
}

function ErrorMessage({ text }: { text: string }) {
  return text ? <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">{text}</p> : null
}

function Result({ children }: { children: ReactNode }) {
  return <div role="status" className="mt-5 space-y-2 rounded-xl border border-accent/20 bg-accent/5 p-5 text-sm text-ink">{children}</div>
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink underline decoration-hairline-strong underline-offset-4">{children} ↗</a>
}

export function ArcNetworkCheck() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof readNetwork>> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function check() {
    setBusy(true)
    setResult(null)
    setError('')
    try { setResult(await readNetwork()) }
    catch (error) { setError(errorMessage(error)) }
    finally { setBusy(false) }
  }
  return <Panel className="mb-6">
    <PanelHeader title="Live Arc Testnet check" meta="Public RPC · on demand" />
    <div className="space-y-4 p-5">
      <p className={copyClass}>Validate chain {ARC.chainId} and read its latest block. Each result is a timestamped observation of the public endpoint.</p>
      <button type="button" className={buttonClass} disabled={busy} onClick={check}>{busy ? 'Checking…' : 'Check Arc Testnet'}</button>
      <ErrorMessage text={error} />
      {result ? <Result><p className="font-mono text-xl">Latest block {result.block}</p><p>Observed {new Date(result.observedAt).toLocaleString()}</p><p className={copyClass}>RPC responded on the expected chain. This check does not establish transaction finality or ongoing uptime.</p></Result> : null}
    </div>
  </Panel>
}

export function ArcBalance() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof readUsdcBalance>> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setResult(null)
    setError('')
    try { setResult(await readUsdcBalance(address.trim())) }
    catch (error) { setError(errorMessage(error)) }
    finally { setBusy(false) }
  }
  return <Panel>
    <PanelHeader title="Read a USDC balance" meta="Live · public wallet inspection" />
    <div className="p-5">
      <p className={copyClass}>Submitting sends this public address to Arc’s RPC. No wallet connection or signature is required.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label htmlFor="arc-wallet" className="block text-sm text-ink">Public address
          <input id="arc-wallet" className={inputClass} value={address} disabled={busy} onChange={event => { setAddress(event.target.value); setResult(null); setError('') }} placeholder="0x…" autoComplete="off" required />
        </label>
        <button className={buttonClass} disabled={busy}>{busy ? 'Reading…' : 'Read balance'}</button>
      </form>
      <ErrorMessage text={error} />
      {result ? <Result>
        <p className="font-mono text-2xl">{result.amount} USDC</p>
        <p className="break-all font-mono text-xs">{result.address}</p>
        <p>Block {result.block} · Observed {new Date(result.observedAt).toLocaleString()}</p>
        <p className={copyClass}>ERC-20 balance, with decimals checked at the same block. Native USDC represents the same funds and is not added.</p>
      </Result> : null}
    </div>
  </Panel>
}

const receiptLabels = {
  'not-found': 'No receipt found',
  included: 'Included · finality unverified',
  finalized: 'Successful · finalized',
  failed: 'Execution failed',
}

export function ArcReceiptInspector() {
  const [hash, setHash] = useState('')
  const [result, setResult] = useState<ReceiptObservation | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setResult(null)
    setError('')
    try { setResult(await readReceipt(hash.trim())) }
    catch (error) { setError(errorMessage(error)) }
    finally { setBusy(false) }
  }
  return <Panel className="mb-6">
    <PanelHeader title="Inspect a transaction receipt" meta="Live · Arc Testnet" />
    <div className="p-5">
      <p className={copyClass}>Look up a public transaction, reconcile its block identity, and check execution and finality. The hash is sent to Arc’s RPC.</p>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label htmlFor="arc-receipt" className="block text-sm text-ink">Transaction hash
          <input id="arc-receipt" className={inputClass} value={hash} disabled={busy} onChange={event => { setHash(event.target.value); setResult(null); setError('') }} placeholder="0x… (64 hexadecimal characters)" autoComplete="off" required />
        </label>
        <button className={buttonClass} disabled={busy}>{busy ? 'Inspecting…' : 'Inspect receipt'}</button>
      </form>
      <ErrorMessage text={error} />
      {result ? <Result>
        <p className="font-display text-xl">{receiptLabels[result.state]}</p>
        {result.state === 'not-found' ? <p>The transaction may be pending, unknown, or unavailable from this endpoint.</p> : <>
          <p>Block {result.block} · Network fee {result.gasFeeUsdc} USDC</p>
          <p>Finality: {result.finality}. Execution status is distinct from block finality.</p>
          <ExternalLink href={`${ARC.explorerUrl}/tx/${result.hash}`}>Open on Arcscan</ExternalLink>
        </>}
        <p className={copyClass}>Observed {new Date(result.observedAt).toLocaleString()}. An RPC observation is not independent cryptographic proof or confirmation of a specific asset transfer.</p>
        <ExportJsonButton data={result} filename={`arcwell-receipt-${result.hash}.json`} />
      </Result> : null}
    </div>
  </Panel>
}

export function ArcAssets() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('USDC')
  const asset = ASSETS.find(item => item.symbol === selected)!
  const filtered = ASSETS.filter(item => `${item.symbol} ${item.name} ${item.type}`.toLowerCase().includes(query.toLowerCase()))
  return <div>
    <ViewHeader index="10" title="Arc assets" blurb="Testnet asset references, access details, and live USDC balance inspection." />
    <div className="mb-6 grid gap-5 xl:grid-cols-2">
      <Panel>
        <PanelHeader title="Asset directory" meta="Published contract references" />
        <div className="space-y-4 p-5">
          <SearchInput value={query} onChange={setQuery} placeholder="Search USDC, EURC, fund…" />
          <div className="space-y-2">{filtered.map(item => <button key={item.symbol} type="button" aria-pressed={item.symbol === selected} onClick={() => setSelected(item.symbol)} className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left ${item.symbol === selected ? 'border-accent/40 bg-accent/10' : 'border-hairline hover:bg-surface-2'}`}>
            <span><strong className="block font-display">{item.symbol}</strong><span className="text-sm text-ink-muted">{item.name}</span></span><span aria-hidden>↗</span>
          </button>)}</div>
          {filtered.length === 0 ? <p className={copyClass}>No matching assets. Try USDC.</p> : null}
          <p className={copyClass}>References reviewed 7 September 2026. Directory entries do not establish live holdings.</p>
        </div>
      </Panel>
      <Panel>
        <PanelHeader title={asset.name} meta={`Asset passport / ${asset.symbol}`} />
        <div className="p-5">
          <p className={`${copyClass} mb-4`}>{asset.description}</p>
          <dl><FieldRow label="Network">{ARC.name}</FieldRow><FieldRow label="ERC-20 decimals">{asset.decimals}</FieldRow><FieldRow label="Access">{asset.access}</FieldRow><FieldRow label="Contract" mono><span className="break-all">{asset.address}</span></FieldRow></dl>
          <div className="mt-4 flex flex-wrap gap-x-5"><ExternalLink href={`${ARC.explorerUrl}/address/${asset.address}`}>Open contract on Arcscan</ExternalLink><ExternalLink href={ARC.source}>Source</ExternalLink><CopyButton text={asset.address} label="contract" /></div>
        </div>
      </Panel>
    </div>
    <ArcBalance />
  </div>
}

export function ArcPayments({ onSave }: { onSave: (draft: PaymentDraft) => void }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [draft, setDraft] = useState<PaymentDraft | null>(null)
  const [error, setError] = useState('')
  function edit(setter: (value: string) => void, value: string) { setter(value); setDraft(null); setError('') }
  function review(event: FormEvent) {
    event.preventDefault()
    setDraft(null)
    setError('')
    try { setDraft(preparePayment(recipient.trim(), amount, reference)) }
    catch (error) { setError(errorMessage(error)) }
  }
  return <div>
    <ViewHeader index="11" title="Payment drafts" blurb="Prepare an exact USDC preview on Arc Testnet. Nothing is signed or sent." />
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel>
        <PanelHeader title="Payment details" meta="01 / Prepare" />
        <form className="space-y-5 p-5" onSubmit={review}>
          <label htmlFor="arc-recipient" className="block text-sm">Recipient address<input id="arc-recipient" className={inputClass} value={recipient} onChange={event => edit(setRecipient, event.target.value)} placeholder="0x…" required autoComplete="off" /></label>
          <label htmlFor="arc-amount" className="block text-sm">Amount in USDC<input id="arc-amount" className={inputClass} value={amount} onChange={event => edit(setAmount, event.target.value)} placeholder="0.00" inputMode="decimal" required aria-describedby="arc-precision" /></label>
          <p id="arc-precision" className={copyClass}>Up to 6 decimal places. Network fees are additional and are not estimated here.</p>
          <label htmlFor="arc-reference" className="block text-sm">Reference (optional, local only)<input id="arc-reference" className={inputClass} value={reference} onChange={event => edit(setReference, event.target.value)} maxLength={80} placeholder="Invoice or payment note" /></label>
          <button className={buttonClass}>Review payment</button>
          <ErrorMessage text={error} />
        </form>
      </Panel>
      <Panel>
        <PanelHeader title="Payment review" meta="02 / Review" />
        <div className="p-5" aria-live="polite">{draft ? <>
          <p className="mb-5 break-all font-mono text-3xl">{draft.amount} USDC</p>
          <dl><FieldRow label="Recipient" mono><span className="break-all">{draft.recipient}</span></FieldRow><FieldRow label="Network">{ARC.name} · {draft.chainId}</FieldRow><FieldRow label="Token units" mono>{draft.amountBaseUnits}</FieldRow><FieldRow label="Reference">{draft.reference || 'None'}</FieldRow><FieldRow label="Network fee">Not estimated</FieldRow><FieldRow label="Status">Local preview · not broadcast</FieldRow></dl>
          <button type="button" className={`${buttonClass} mt-5`} onClick={() => onSave(draft)}>Save draft to activity</button>
        </> : <p className={copyClass}>Your preview appears here after the recipient and amount pass validation.</p>}
          <p className={`${copyClass} mt-6 border-t border-hairline pt-5`}>Live transfers require wallet review, balance and fee checks, simulation, and receipt reconciliation. Sending is not enabled.</p>
        </div>
      </Panel>
    </div>
  </div>
}

export function ArcActivity({ records, onPrepare }: { records: DraftRecord[]; onPrepare: () => void }) {
  return <div>
    <ViewHeader index="12" title="Draft activity" blurb="Your local payment previews, with exports and a public transaction receipt inspector." actions={records.length ? <ExportJsonButton data={records} filename="arcwell-payment-drafts.json" /> : undefined} />
    <Panel className="mb-6">
      <PanelHeader title="Local payment drafts" meta={`${records.length} records · not sent`} />
      <div className="divide-y divide-hairline">{records.map(record => <article key={record.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0"><h3 className="break-words font-display font-semibold">{record.reference || 'USDC payment'}</h3><p className="mt-1 break-all font-mono text-xs text-ink-muted">{shortHash(record.recipient)}</p><p className="mt-2 text-xs text-ink-muted">{new Date(record.createdAt).toLocaleString()} · Draft, not sent</p></div>
        <p className="break-all font-mono">{record.amount} USDC</p><ExportJsonButton data={record} filename={`arcwell-draft-${record.id}.json`} />
      </article>)}</div>
      {!records.length ? <div className="space-y-4 p-5"><p className={copyClass}>Prepare a USDC payment to create your first local review record.</p><button type="button" className={buttonClass} onClick={onPrepare}>Prepare a payment</button></div> : null}
      <p className="border-t border-hairline p-5 text-xs leading-relaxed text-ink-muted">Drafts stay in memory while navigating dashboard categories. Reloading or leaving the dashboard clears them. Export JSON to keep a record. No transaction hash or settlement claim is generated.</p>
    </Panel>
    <ArcReceiptInspector />
  </div>
}

export function ArcNetwork() {
  return <div>
    <ViewHeader index="13" title="Arc network" blurb="Testnet configuration and explicit observations from the public RPC." actions={<ExternalLink href={ARC.faucetUrl}>Get testnet funds</ExternalLink>} />
    <ArcNetworkCheck />
    <Panel><PanelHeader title="Testnet configuration" meta="Mainnet is not configured" /><div className="p-5"><dl>
      <FieldRow label="Chain ID" mono>{ARC.chainId}</FieldRow><FieldRow label="Gas currency">USDC · {ARC.nativeDecimals} native decimals</FieldRow><FieldRow label="USDC interface">ERC-20 · {ARC.usdcDecimals} decimals</FieldRow><FieldRow label="RPC endpoint" mono><span className="break-all">{ARC.rpcUrl}</span></FieldRow><FieldRow label="CCTP domain">{ARC.cctpDomain}</FieldRow>
    </dl><ExternalLink href="https://docs.arc.io/integrate/connect-to-arc">Official network documentation</ExternalLink><p className={copyClass}>8-second timeout per request. Checks run on demand, with no background polling or paid RPC service.</p></div></Panel>
  </div>
}

export function ArcIntegrations() {
  return <div>
    <ViewHeader index="14" title="Arc integrations" blurb="The existing ecosystem roadmap. These provider integrations are planned and are not connected." />
    <div className="grid gap-5 xl:grid-cols-2">{INTEGRATIONS.map(item => <Panel key={item.name}>
      <PanelHeader title={item.name} meta={item.category} />
      <div className="space-y-4 p-5"><p className={copyClass}>{item.description}</p><p className="font-mono text-xs uppercase tracking-wider">Planned · not connected</p><p className={copyClass}>{item.need}</p><ExternalLink href={item.url}>Provider documentation</ExternalLink></div>
    </Panel>)}</div>
    <p className={`${copyClass} mt-6`}>No provider account, paid subscription, API credential, or live execution capability is configured.</p>
  </div>
}
