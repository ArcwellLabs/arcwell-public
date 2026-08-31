import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ARC, ASSETS, preparePayment, readNetwork, readUsdcBalance } from './arc';
import type { PaymentDraft } from './arc';
import { ReceiptInspector } from './ReceiptInspector';

const NAV = ['Overview', 'Assets', 'Payments', 'Activity', 'Network', 'Integrations'] as const;
type Page = (typeof NAV)[number];
type DraftRecord = PaymentDraft & { id: string; createdAt: string };

function currentPage(): Page {
  return NAV.find((page) => `#${page.toLowerCase()}` === location.hash) ?? 'Overview';
}
function message(error: unknown) {
  return error instanceof Error ? error.message : 'The request could not be completed.';
}
function short(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    Overview: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </>
    ),
    Assets: (
      <>
        <path d="M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    Payments: (
      <>
        <path d="M3 7h17m-5-5 5 5-5 5M21 17H4m5-5-5 5 5 5" />
      </>
    ),
    Activity: (
      <>
        <path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM8 8h8M8 12h6" />
      </>
    ),
    Network: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z" />
      </>
    ),
    Integrations: (
      <>
        <path d="M8 3v5m8-5v5M5 8h14v3a7 7 0 0 1-14 0V8Zm7 10v4" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {paths[name] ?? paths.Assets}
    </svg>
  );
}

export function App() {
  const [page, setPage] = useState<Page>(currentPage);
  const [records, setRecords] = useState<DraftRecord[]>([]);
  useEffect(() => {
    const changed = () => setPage(currentPage());
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    document.title = `${page} · ARCWELL`;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [page]);
  function saveDraft(draft: PaymentDraft) {
    setRecords((previous) => [
      { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...previous,
    ]);
    location.hash = 'activity';
  }
  return (
    <div className="app">
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a href="#overview" className="brand">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M3 27 16 4l13 23M9 18h14" />
          </svg>
          ARCWELL
        </a>
        <div className="workspace">
          <span className="workspace-monogram">A</span>
          <div>
            Arc workspace<small>Development edition</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {NAV.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              aria-current={page === item ? 'page' : undefined}
            >
              <Icon name={item} />
              {item}
              {item === 'Activity' && records.length > 0 ? (
                <span className="nav-count">{records.length}</span>
              ) : null}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network-dot" />
          <span>
            Built for Arc<small>Testnet · {ARC.chainId}</small>
          </span>
          <a href={ARC.source} target="_blank" rel="noreferrer" aria-label="Read Arc documentation">
            ↗
          </a>
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span> <strong>{page}</strong>
          </span>
          <div className="topbar-right">
            <span className="mode">
              <span /> Local preview
            </span>
            <a className="button small" href={ARC.faucetUrl} target="_blank" rel="noreferrer">
              Get testnet funds <span>↗</span>
            </a>
            <span className="avatar" aria-label="ARCWELL workspace">
              AW
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {page === 'Overview' ? <Overview /> : null}
          {page === 'Assets' ? <Assets /> : null}
          {page === 'Payments' ? <Payments onSave={saveDraft} /> : null}
          {page === 'Activity' ? <Activity records={records} /> : null}
          {page === 'Network' ? <Network /> : null}
          {page === 'Integrations' ? <Integrations /> : null}
        </main>
        <footer>
          <span>ARCWELL · Independent software for the Arc ecosystem</span>
          <span>Development preview / v0.1</span>
        </footer>
      </div>
    </div>
  );
}

function Heading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{children}</p>
      </div>
      {action}
    </div>
  );
}

function Overview() {
  return (
    <>
      <Heading
        eyebrow="YOUR MONEY, IN MOTION"
        title="A clearer view of your capital."
        action={
          <a href="#payments" className="button primary">
            Prepare a payment <span>↗</span>
          </a>
        }
      >
        Stablecoin assets, payment workflows, and settlement. One Arc workspace.
      </Heading>
      <div className="preview-note">
        <span className="dot" />
        You’re exploring a sample workspace. Balances and activity below are illustrative.
      </div>
      <section className="overview-grid" aria-label="Sample balances">
        <div className="capital-card">
          <div className="card-label">
            SAMPLE USDC BALANCE <span>01 / DOLLAR</span>
          </div>
          <div className="capital-value">
            24,850<span>.00</span>
            <small>USDC</small>
          </div>
          <p>One currency for payments and network fees.</p>
          <div className="capital-bottom">
            <span>Arc Testnet</span>
            <span>Illustrative balance ↗</span>
          </div>
          <div className="arc-art" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="summary-card">
          <div className="card-label">
            SAMPLE EURC BALANCE <span>02</span>
          </div>
          <h2>
            6,200<span>.00</span>
          </h2>
          <p>EURC · Euro-denominated funds</p>
          <div className="mini-bars" aria-hidden="true">
            {[35, 44, 39, 58, 52, 67, 61, 77, 72, 83, 80, 94].map((v, i) => (
              <i key={i} style={{ height: `${v}%` }} />
            ))}
          </div>
          <small>Illustrative allocation · no FX conversion</small>
        </div>
        <div className="summary-card network-card">
          <div className="card-label">
            NETWORK FOUNDATION <span>03</span>
          </div>
          <div className="network-graphic" aria-hidden="true">
            <Icon name="Network" />
          </div>
          <h2>
            USDC<span> for gas</span>
          </h2>
          <p>Keep payments and fee budgeting in the same unit of account.</p>
          <a href="#network" className="text-link">
            Inspect Arc Testnet <span>↗</span>
          </a>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE ARC ADVANTAGE</p>
          <h2>Built around stablecoin finance.</h2>
        </div>
        <a href="#integrations" className="text-link">
          Integration roadmap ↗
        </a>
      </div>
      <section className="feature-grid">
        <Feature
          number="01"
          title="Know what you hold."
          body="Inspect asset contracts, token precision, and access requirements in an Arc-specific asset passport."
          href="#assets"
          cta="Explore assets"
        />
        <Feature
          number="02"
          title="Make every payment legible."
          body="Prepare a USDC payment, validate its amount and recipient, and export a clear review record."
          href="#payments"
          cta="Prepare payment"
        />
        <Feature
          number="03"
          title="Follow the settlement."
          body="Inspect public transaction receipts, reconcile their blocks, and distinguish execution success from finality."
          href="#activity"
          cta="View activity"
        />
      </section>
      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Asset watch</h2>
            <a href="#assets" className="text-link">
              View directory ↗
            </a>
          </div>
          {ASSETS.map((asset) => (
            <div className="asset-row" key={asset.symbol}>
              <span className={`token token-${asset.symbol.toLowerCase()}`}>
                {asset.symbol === 'EURC' ? '€' : asset.symbol === 'USDC' ? '$' : 'Y'}
              </span>
              <div>
                <strong>{asset.symbol}</strong>
                <small>{asset.type}</small>
              </div>
              <span className="asset-state">
                {asset.symbol === 'USYC' ? 'Restricted access' : 'Testnet contract'}
              </span>
              <a
                href={`${ARC.explorerUrl}/address/${asset.address}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Inspect ${asset.symbol} contract on Arcscan`}
              >
                ↗
              </a>
            </div>
          ))}
        </section>
        <section className="next-card">
          <p className="eyebrow">ON THE HORIZON</p>
          <h2>
            Crosschain liquidity.
            <br />
            An Arc destination.
          </h2>
          <p>
            CCTP transfer tracking, StableFX quotes, and Gateway balances are planned integrations.
          </p>
          <a href="#integrations" className="button">
            See what’s next <span>↗</span>
          </a>
        </section>
      </div>
    </>
  );
}

function Feature({
  number,
  title,
  body,
  href,
  cta,
}: {
  number: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="feature">
      <span className="feature-number">{number}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      <a href={href} className="text-link">
        {cta} <span>↗</span>
      </a>
    </article>
  );
}

function Assets() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('USDC');
  const asset = ASSETS.find((item) => item.symbol === selected)!;
  const filtered = ASSETS.filter((item) =>
    `${item.name} ${item.symbol} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading eyebrow="ASSET DIRECTORY" title="Know the asset. Read the source.">
        Arc Testnet contract references, with clear access and precision details.
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <label className="search-label" htmlFor="asset-search">
            Find an asset
          </label>
          <input
            id="asset-search"
            placeholder="Search USDC, EURC, fund…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="asset-list">
            {filtered.map((item) => (
              <button
                className="asset-select"
                key={item.symbol}
                aria-pressed={selected === item.symbol}
                onClick={() => setSelected(item.symbol)}
              >
                <span className={`token token-${item.symbol.toLowerCase()}`}>
                  {item.symbol.slice(0, 1)}
                </span>
                <span>
                  <strong>{item.symbol}</strong>
                  <small>{item.name}</small>
                </span>
                <span>↗</span>
              </button>
            ))}
            {filtered.length === 0 ? <p>No matching assets. Try a symbol such as USDC.</p> : null}
          </div>
          <p className="fine-print">
            Source: Arc documentation · reviewed 7 September 2026. A directory entry is not a
            verified live holding.
          </p>
        </section>
        <section className="panel passport">
          <p className="eyebrow">ASSET PASSPORT / {asset.symbol}</p>
          <h2>{asset.name}</h2>
          <p>{asset.description}</p>
          <dl>
            <dt>Network</dt>
            <dd>{ARC.name}</dd>
            <dt>ERC-20 decimals</dt>
            <dd>{asset.decimals}</dd>
            <dt>Access</dt>
            <dd>{asset.access}</dd>
            <dt>Contract</dt>
            <dd className="address">{asset.address}</dd>
            <dt>Evidence</dt>
            <dd>Published contract reference; live code not qualified</dd>
          </dl>
          <a
            className="button"
            href={`${ARC.explorerUrl}/address/${asset.address}`}
            target="_blank"
            rel="noreferrer"
          >
            Open contract on Arcscan ↗
          </a>{' '}
          <a className="text-link" href={ARC.source} target="_blank" rel="noreferrer">
            Source ↗
          </a>
        </section>
      </div>
      <PublicBalance />
    </>
  );
}

function PublicBalance() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<Awaited<ReturnType<typeof readUsdcBalance>> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setError('');
    try {
      setResult(await readUsdcBalance(address));
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel balance-panel">
      <div>
        <p className="eyebrow">PUBLIC WALLET INSPECTION</p>
        <h2>Read a USDC balance.</h2>
        <p>
          Read-only. Submitting shares the public address with Arc’s RPC. No wallet connection or
          signature.
        </p>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="wallet-address">Public address</label>
        <div className="inline-form">
          <input
            id="wallet-address"
            value={address}
            disabled={busy}
            onChange={(event) => {
              setAddress(event.target.value);
              setResult(null);
              setError('');
            }}
            placeholder="0x…"
            autoComplete="off"
            required
          />
          <button disabled={busy} className="button primary">
            {busy ? 'Reading…' : 'Read balance'}
          </button>
        </div>
      </form>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
      {result ? (
        <div role="status" className="result">
          <strong>{result.amount} USDC</strong>
          <p>
            {short(result.address)} · Block {result.block} · Observed{' '}
            {new Date(result.observedAt).toLocaleString()}
          </p>
          <small>
            ERC-20 balance only. Native USDC is the same underlying balance and is not added.
          </small>
        </div>
      ) : null}
    </section>
  );
}

function Payments({ onSave }: { onSave: (draft: PaymentDraft) => void }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [draft, setDraft] = useState<PaymentDraft | null>(null);
  const [error, setError] = useState('');
  function review(event: FormEvent) {
    event.preventDefault();
    setError('');
    setDraft(null);
    try {
      setDraft(preparePayment(recipient.trim(), amount, reference));
    } catch (error) {
      setError(message(error));
    }
  }
  function edit(setter: (value: string) => void, value: string) {
    setter(value);
    setDraft(null);
    setError('');
  }
  return (
    <>
      <Heading eyebrow="USDC PAYMENTS" title="Make the next move clear.">
        Prepare an exact payment preview for Arc Testnet. Nothing is signed or sent.
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>Payment details</h2>
            <span className="muted">01 / PREPARE</span>
          </div>
          <form className="payment-form" onSubmit={review}>
            <label htmlFor="recipient">Recipient address</label>
            <input
              id="recipient"
              value={recipient}
              onChange={(event) => edit(setRecipient, event.target.value)}
              placeholder="0x…"
              required
              autoComplete="off"
            />
            <label htmlFor="amount">Amount in USDC</label>
            <input
              id="amount"
              value={amount}
              onChange={(event) => edit(setAmount, event.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              required
            />
            <small>
              Up to 6 decimal places. Network fees are additional and not estimated here.
            </small>
            <label htmlFor="reference">
              Reference <span className="muted">(optional, local only)</span>
            </label>
            <input
              id="reference"
              value={reference}
              onChange={(event) => edit(setReference, event.target.value)}
              maxLength={80}
              placeholder="Invoice or payment note"
            />
            <button className="button primary" type="submit">
              Review payment <span>↗</span>
            </button>
            {error ? (
              <p role="alert" className="error">
                {error}
              </p>
            ) : null}
          </form>
        </section>
        <section className="panel payment-review" aria-live="polite">
          <p className="eyebrow">02 / REVIEW</p>
          {draft ? (
            <>
              <h2>
                {draft.amount} <span>USDC</span>
              </h2>
              <dl>
                <dt>Recipient</dt>
                <dd className="address">{draft.recipient}</dd>
                <dt>Network</dt>
                <dd>
                  {ARC.name} · {draft.chainId}
                </dd>
                <dt>Token units</dt>
                <dd>{draft.amountBaseUnits}</dd>
                <dt>Reference</dt>
                <dd>{draft.reference || 'None'}</dd>
                <dt>Network fee</dt>
                <dd>Not estimated</dd>
                <dt>Status</dt>
                <dd>Local preview · not broadcast</dd>
              </dl>
              <button className="button primary" onClick={() => onSave(draft)}>
                Save draft to activity ↗
              </button>
            </>
          ) : (
            <>
              <div className="review-graphic">
                <Icon name="Payments" />
              </div>
              <h2>
                Details first.
                <br />
                Confidence follows.
              </h2>
              <p>
                Your payment preview will appear here after the recipient and amount pass
                validation.
              </p>
            </>
          )}
          <div className="fine-print">
            Live transfers require wallet review, balance and fee checks, simulation, and receipt
            reconciliation. These are not enabled in this starter.
          </div>
        </section>
      </div>
    </>
  );
}

function Activity({ records }: { records: DraftRecord[] }) {
  return (
    <>
      <Heading eyebrow="PAYMENT RECORDS" title="A record of every intention.">
        Review local drafts and inspect public Arc Testnet transaction receipts.
      </Heading>
      <section className="panel">
        <div className="panel-heading">
          <h2>Draft activity</h2>
          <span className="muted">{records.length} records</span>
        </div>
        {records.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Reference / recipient</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.reference || 'USDC payment'}</strong>
                      <small>{short(record.recipient)}</small>
                    </td>
                    <td>{record.amount} USDC</td>
                    <td>{new Date(record.createdAt).toLocaleString()}</td>
                    <td>Draft · not sent</td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => download(`arcwell-draft-${record.id}.json`, record)}
                      >
                        Export JSON ↗
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <Icon name="Activity" />
            <h2>Your next payment starts here.</h2>
            <p>Prepare a USDC payment to create your first local review record.</p>
            <a className="button primary" href="#payments">
              Prepare a payment ↗
            </a>
          </div>
        )}
        <p className="fine-print">
          Drafts stay in memory and clear when this page reloads. Export a record if you want to
          keep it. No transaction hash or settlement claim is generated.
        </p>
      </section>
      <ReceiptInspector />
    </>
  );
}

function Network() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof readNetwork>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function refresh() {
    setResult(null);
    setError('');
    setBusy(true);
    try {
      setResult(await readNetwork());
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading eyebrow="ARC NETWORK" title="The settlement foundation.">
        Verified configuration, explicit observations, and no assumed network health.
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <p className="eyebrow">TESTNET CONFIGURATION</p>
          <h2>{ARC.name}</h2>
          <dl>
            <dt>Chain ID</dt>
            <dd>{ARC.chainId}</dd>
            <dt>Gas currency</dt>
            <dd>USDC · 18 native decimals</dd>
            <dt>USDC interface</dt>
            <dd>ERC-20 · 6 decimals</dd>
            <dt>RPC endpoint</dt>
            <dd className="address">{ARC.rpcUrl}</dd>
            <dt>CCTP domain</dt>
            <dd>{ARC.cctpDomain}</dd>
            <dt>Mainnet</dt>
            <dd>Not configured</dd>
          </dl>
          <a
            className="text-link"
            href="https://docs.arc.io/integrate/connect-to-arc"
            target="_blank"
            rel="noreferrer"
          >
            Official network documentation ↗
          </a>
        </section>
        <section className="panel">
          <p className="eyebrow">LIVE READ-ONLY CHECK</p>
          <h2>
            {busy ? 'Checking the network…' : result ? 'RPC responded.' : 'Ready when you are.'}
          </h2>
          <p>
            The check validates the chain ID before reading the latest block. Results describe this
            endpoint at the observed time.
          </p>
          <button className="button primary" disabled={busy} onClick={refresh}>
            {busy ? 'Checking…' : 'Check Arc Testnet'} ↗
          </button>
          {error ? (
            <p role="alert" className="error">
              {error}
            </p>
          ) : null}
          {result ? (
            <div className="result" role="status">
              <strong>Latest block {result.block}</strong>
              <p>Observed {new Date(result.observedAt).toLocaleString()}</p>
              <small>
                A successful RPC read does not prove transaction finality or service uptime.
              </small>
            </div>
          ) : null}
          <p className="fine-print">
            8-second timeout per request. No background polling or paid RPC service.
          </p>
        </section>
      </div>
    </>
  );
}

const INTEGRATIONS = [
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

function Integrations() {
  return (
    <>
      <Heading eyebrow="ECOSYSTEM ROADMAP" title="Arc-native, by design.">
        A focused path from payment previews to connected stablecoin workflows.
      </Heading>
      <div className="integration-grid">
        {INTEGRATIONS.map((integration, index) => (
          <article className="panel integration" key={integration.name}>
            <div className="card-label">
              {integration.category}
              <span>0{index + 1}</span>
            </div>
            <h2>{integration.name}</h2>
            <p>{integration.description}</p>
            <div className="integration-status">Planned · not connected</div>
            <p className="fine-print">{integration.need}</p>
            <a className="text-link" href={integration.url} target="_blank" rel="noreferrer">
              Provider documentation ↗
            </a>
          </article>
        ))}
      </div>
      <div className="preview-note">
        No provider account, paid subscription, API credential, or live execution capability is
        configured.
      </div>
    </>
  );
}
