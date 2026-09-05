/**
 * Mock data for ARCWELL Field notes, 6 original articles about proof-only
 * infrastructure on ARC: evidence hashing, verifier networks, correction
 * trails, read-only APIs, and reward controls. All copy is original and
 * follows the ARCWELL product boundary (no securities/marketplace language).
 */

export type Category = 'Protocol' | 'Evidence' | 'Verification' | 'Corrections' | 'Data' | 'Rewards'

export const CATEGORIES: Category[] = [
  'Protocol',
  'Evidence',
  'Verification',
  'Corrections',
  'Data',
  'Rewards',
]

export type Inline = string | { text: string; href: string }

export type ArticleBlock =
  | { type: 'lead'; text: Inline[] }
  | { type: 'paragraph'; text: Inline[] }
  | { type: 'heading'; index: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'tips'; items: { title: string; text: string }[] }
  | { type: 'comparison' }

export interface ComparisonRow {
  label: string
  footprint: string
  cost: string
  auditability: string
}

/** Anchoring-model comparison shown in "Proof-only infrastructure, explained". */
export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'Full document onchain',
    footprint: 'Entire file, public by default',
    cost: 'High, scales with size',
    auditability: 'Open, but leaks sensitive data',
  },
  {
    label: 'Hash-only anchor',
    footprint: '32-byte digest + timestamp',
    cost: 'Minimal and flat',
    auditability: 'Tamper-evident, context-poor',
  },
  {
    label: 'ARCWELL hybrid',
    footprint: 'Hash + metadata + visibility policy',
    cost: 'Flat per record',
    auditability: 'Evidence-linked, permission-aware',
  },
]

export interface ArticleAuthor {
  name: string
  role: string
}

export const AUTHOR: ArticleAuthor = {
  name: 'ARCWELL Research',
  role: 'Protocol team, ARC network',
}

export interface Article {
  slug: string
  title: string
  titleLines: string[]
  category: Category
  date: string
  readTime: string
  image: string
  excerpt: string
  body: ArticleBlock[]
}

/* ------------------------------------------------------------------ */
/* Canonical body, "Proof-only infrastructure, explained"             */
/* ------------------------------------------------------------------ */

const PROOF_ONLY_BODY: ArticleBlock[] = [
  {
    type: 'lead',
    text: [
      'Most infrastructure promises to move something: money, messages, compute. ARCWELL moves nothing. It proves something, that a specific record, with a specific evidence hash, was submitted by a specific organization at a specific time, and has not been altered since. That narrower promise is the entire product, and this note explains why the narrowness is the point.',
    ],
  },
  { type: 'heading', index: '01', text: 'What an ARC anchor actually proves' },
  {
    type: 'paragraph',
    text: [
      'An anchor on ARC is a compact claim: this digest existed at this timestamp, signed by this submitter. Anyone with the original evidence can recompute the hash and confirm the match. Anyone without it learns the metadata the organization chose to disclose, and nothing more. The chain holds the proof; the ',
      { text: 'evidence storage layer', href: '/articles/evidence-hashing-on-arc' },
      ' holds the files, encrypted or permissioned, with content-addressed references.',
    ],
  },
  {
    type: 'paragraph',
    text: [
      'What an anchor does not prove is just as important. It does not prove the underlying transaction was lawful, valid, authorized, complete, or correctly classified. It does not certify compliance with any rule set. It proves integrity of the record, not truth of the event, and ARCWELL labels that distinction everywhere the record appears.',
    ],
  },
  { type: 'heading', index: '02', text: 'The product boundary, plainly' },
  {
    type: 'paragraph',
    text: [
      'ARCWELL is software for recording, anchoring, and verifying evidence of transactions that occurred through systems operated by other parties. It does not issue, offer, sell, broker, custody, or settle anything. It does not match buyers and sellers, move payments, or decide whether an instrument is a security. Those are someone else\'s jobs, our job is to make the evidence of what happened durable, timestamped, and independently checkable.',
    ],
  },
  {
    type: 'paragraph',
    text: [
      'This boundary is not a disclaimer bolted on at the end. It is the architecture. The registry is append-only. The APIs are read-only. The verifier workspace can flag a discrepancy but never edit the record it flags. Every layer is built so that ARCWELL physically cannot become the thing it is not.',
    ],
  },
  { type: 'heading', index: '03', text: 'Three anchoring models, compared' },
  {
    type: 'paragraph',
    text: [
      'Teams evaluating proof infrastructure usually weigh three approaches. They differ in what goes onchain, what it costs, and how much an auditor can actually learn:',
    ],
  },
  { type: 'comparison' },
  {
    type: 'paragraph',
    text: [
      'Putting whole documents onchain is maximally transparent and maximally reckless, sensitive data becomes permanent and public. A bare hash is cheap and private, but an auditor holding only a digest knows nothing about what it commits to. The hybrid model anchors the hash alongside structured metadata and a visibility policy, so authorized parties get context and everyone else gets proof without exposure.',
    ],
  },
  { type: 'quote', text: 'An anchor proves a record existed and was not altered. It does not prove the record was right.' },
  { type: 'heading', index: '04', text: 'Designing for correction from day one' },
  {
    type: 'paragraph',
    text: [
      'Any system that records real-world events will record some of them wrong. The question is whether a fix erases the mistake or documents it. Four habits keep an anchored record set honest:',
    ],
  },
  {
    type: 'tips',
    items: [
      {
        title: 'Anchor early, correct openly',
        text: 'Submit the record when the source system reports it. If it is wrong, append a correction that links back, never overwrite the original entry.',
      },
      {
        title: 'Keep evidence offchain but addressed',
        text: 'Store source files in encrypted, content-addressed storage. The anchor carries the hash; the storage carries the bytes; the two verify each other.',
      },
      {
        title: 'Give verifiers structured flags',
        text: 'A discrepancy flag should name the field, cite the evidence, and carry a timestamp, a finding, not a vibe.',
      },
      {
        title: 'Label every source',
        text: 'Third-party rule or screening results are displayed with their source and time. Provenance is part of the data, not a footnote.',
      },
    ],
  },
  { type: 'heading', index: '05', text: 'The honest verdict' },
  {
    type: 'paragraph',
    text: [
      'Proof-only infrastructure is right when the hard problem is trust in records: audits, disclosures, multi-party workflows where no one should have to take anyone\'s word. It is the wrong tool when the problem is execution, moving value, matching counterparties, enforcing terms. That belongs to other systems, and ARCWELL is deliberately built to hand those records back to them with proof attached.',
    ],
  },
  {
    type: 'paragraph',
    text: [
      'If that narrower promise sounds like exactly what your recordkeeping needs, ',
      { text: 'start a verification pilot', href: '/contact' },
      ' and we will scope it against your actual record volume.',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Generic body builder for the remaining five articles                */
/* ------------------------------------------------------------------ */

interface GenericSections {
  lead: string
  sections: { index: string; heading: string; paragraphs: string[] }[]
  quote: string
  closing: string
}

function genericBody(g: GenericSections): ArticleBlock[] {
  const blocks: ArticleBlock[] = [{ type: 'lead', text: [g.lead] }]
  for (const s of g.sections) {
    blocks.push({ type: 'heading', index: s.index, text: s.heading })
    for (const p of s.paragraphs) blocks.push({ type: 'paragraph', text: [p] })
  }
  blocks.push({ type: 'quote', text: g.quote })
  blocks.push({ type: 'paragraph', text: [g.closing] })
  return blocks
}

/* ------------------------------------------------------------------ */
/* The six articles                                                    */
/* ------------------------------------------------------------------ */

export const ARTICLES: Article[] = [
  {
    slug: 'proof-only-infrastructure',
    title: 'Proof-only infrastructure, explained',
    titleLines: ['Proof-only infrastructure,', 'explained'],
    category: 'Protocol',
    date: 'Mar 12, 2025',
    readTime: '7 min',
    image: '/art-01.png',
    excerpt:
      'What an ARC anchor proves, what it deliberately refuses to prove, and why the narrowest promise in infrastructure is the most useful one.',
    body: PROOF_ONLY_BODY,
  },
  {
    slug: 'evidence-hashing-on-arc',
    title: 'How evidence hashing works on ARC',
    titleLines: ['How evidence hashing', 'works on ARC'],
    category: 'Evidence',
    date: 'Feb 26, 2025',
    readTime: '5 min',
    image: '/art-02.png',
    excerpt:
      'From source document to 32-byte digest: the pipeline that turns transaction evidence into a tamper-evident onchain anchor.',
    body: genericBody({
      lead: 'Every ARCWELL record begins as a pile of evidence: source documents, references, timestamps from systems we do not operate. Before any of it touches ARC, it passes through a hashing pipeline that decides exactly what the chain will commit to. Here is how that pipeline works, step by step.',
      sections: [
        {
          index: '01',
          heading: 'From document to digest',
          paragraphs: [
            'Each piece of evidence is normalized, then hashed with a collision-resistant digest function. The output is a fixed-size fingerprint: change a single byte of the source and the digest changes completely. The record on ARC stores the digest, the event timestamp, and the submitter signature, never the raw file.',
          ],
        },
        {
          index: '02',
          heading: 'Content-addressed storage',
          paragraphs: [
            'The files themselves live in encrypted or permissioned storage, addressed by their own content hash. That means the storage reference doubles as an integrity check: fetch the file, recompute the digest, and any tampering announces itself. Retention rules and access logs sit in the same layer, so who saw what, and when, is itself recorded.',
          ],
        },
        {
          index: '03',
          heading: 'Timestamps and submitter signatures',
          paragraphs: [
            'The anchor binds three things together: the evidence hash, the chain timestamp, and the submitting organization\'s signature. Anyone can later verify all three independently. The organization cannot backdate a record, and no one else can forge its submission, the signature and the ledger disagree with both stories.',
          ],
        },
      ],
      quote: 'If a single byte changes, the hash says so, politely and permanently.',
      closing:
        'Hashing is the cheapest strong guarantee in the stack. It costs almost nothing to compute, nothing to verify, and it converts the entire question of “was this altered?” into arithmetic anyone can redo.',
    }),
  },
  {
    slug: 'verifier-network-design',
    title: 'Designing a verifier network that resists capture',
    titleLines: ['Designing a verifier network', 'that resists capture'],
    category: 'Verification',
    date: 'Jan 30, 2025',
    readTime: '8 min',
    image: '/art-03.png',
    excerpt:
      'Independence, structured findings, and reputation with an appeal trail, the design constraints behind ARCWELL’s verifier workspace.',
    body: genericBody({
      lead: 'A record system that verifies itself has proven nothing. ARCWELL’s verification layer is intentionally staffed by independent participants who review disclosed records, compare evidence, and flag inconsistencies. Making that network trustworthy is a design problem, and it has three non-negotiable constraints.',
      sections: [
        {
          index: '01',
          heading: 'Independence is a design constraint',
          paragraphs: [
            'Verifiers do not buy, hold, or trade anything through ARCWELL, and they are not agents of the organizations whose records they review. Their only asset is a public track record of valid findings. That separation is structural: the workspace gives verifiers evidence comparison tools and a challenge channel, and no way to touch the records themselves.',
          ],
        },
        {
          index: '02',
          heading: 'Structured findings, not opinions',
          paragraphs: [
            'A flag in the verifier workspace must name the field in question, cite the evidence that contradicts it, and carry a timestamp. Vague objections do not enter the audit history. This structure does two jobs at once: it makes each finding checkable, and it makes the difference between signal and noise measurable.',
          ],
        },
        {
          index: '03',
          heading: 'Reputation with an appeal trail',
          paragraphs: [
            'Verifiers build reputation from findings that survive review. Organizations can challenge a flag, and the challenge, plus its resolution, joins the same append-only history as the record itself. Nobody, verifier or organization, gets the last word by default. The history gets the last word.',
          ],
        },
      ],
      quote: 'A verifier network earns trust the same way a record does: with evidence.',
      closing:
        'Capture-proof does not mean capture-impossible, it means the cost of corrupting the network stays higher than the reward. Independence, structure, and a public appeal trail are how we keep that arithmetic honest.',
    }),
  },
  {
    slug: 'correction-trails',
    title: 'Correction trails: fixing records without erasing history',
    titleLines: ['Correction trails:', 'fixing records openly'],
    category: 'Corrections',
    date: 'Dec 11, 2024',
    readTime: '6 min',
    image: '/art-04.png',
    excerpt:
      'Append-only means mistakes stay visible. How ARCWELL links corrections to originals and keeps disputes on the record.',
    body: genericBody({
      lead: 'Real-world data is wrong more often than anyone likes to admit. A source system misreports an amount, an event type gets misclassified, a document is superseded. In a conventional database these get patched silently. On ARC, silence is not available, so we built correction trails instead.',
      sections: [
        {
          index: '01',
          heading: 'Append-only means mistakes stay visible',
          paragraphs: [
            'Nothing on the ARC registry is edited or deleted. When a record is wrong, the organization submits a correction entry that supersedes the original. The original remains, clearly marked, with the correction linked to it. An auditor sees not just the current state but the full sequence of how the record got there.',
          ],
        },
        {
          index: '02',
          heading: 'How a correction links to the original',
          paragraphs: [
            'Each correction carries the identifier of the record it amends, a reason code, fresh evidence where relevant, and its own signature and timestamp. The public explorer renders this as a visible chain: original entry, flags raised against it, corrections applied, and current status, each hop independently verifiable.',
          ],
        },
        {
          index: '03',
          heading: 'Disputes, flags, and resolution states',
          paragraphs: [
            'Corrections are not the only way records change state. A verifier flag moves a record into a disputed state; an organization response moves it toward resolution; the outcome is recorded either way. A record that was challenged and upheld carries that history as a mark of scrutiny survived, more trustworthy, not less, than one never examined.',
          ],
        },
      ],
      quote: 'You cannot delete a mistake on ARC. You can only out-document it.',
      closing:
        'The correction trail converts errors from liabilities into evidence of a working process. Organizations that correct openly end up with the strongest audit histories on the network, which is exactly the incentive the system was designed to create.',
    }),
  },
  {
    slug: 'read-only-apis',
    title: 'Read-only APIs and the public record explorer',
    titleLines: ['Read-only APIs and the', 'public record explorer'],
    category: 'Data',
    date: 'Nov 20, 2024',
    readTime: '5 min',
    image: '/art-05.png',
    excerpt:
      'Why ARCWELL’s data services cannot write anything, how source attribution works by default, and what the explorer exposes.',
    body: genericBody({
      lead: 'Every API ARCWELL exposes is read-only. That is not a limitation we plan to lift, it is a guarantee we print on the label. When the only thing a data service can do is observe, an entire class of abuse stops being possible. This note covers what the data layer provides and why it is shaped this way.',
      sections: [
        {
          index: '01',
          heading: 'Why read-only is a feature',
          paragraphs: [
            'Records enter the registry through one channel only: signed submission by an authorized organization via the portal. The API tier sits downstream and can query, stream, and export, never mutate. If an API key leaks, the blast radius is disclosure within the record\'s existing visibility policy, not tampering with the ledger.',
          ],
        },
        {
          index: '02',
          heading: 'Source attribution by default',
          paragraphs: [
            'Every field the explorer shows carries its source and the time it was recorded. Third-party rule or screening results are displayed with the provider, the rule set, and the check time, clearly labeled as outcomes of a check, not certifications. Consumers of the API get the same attribution in every payload, because a number without provenance is just a rumor with formatting.',
          ],
        },
        {
          index: '03',
          heading: 'Webhooks and exportable audit reports',
          paragraphs: [
            'Monitoring teams subscribe to webhooks for anchor confirmations, new flags, and correction events. Auditors export complete, self-verifying report bundles: record metadata, hashes, timestamps, and the verification history needed to re-check every claim offline. The explorer renders the same data for humans, searchable by organization, series, status, and time.',
          ],
        },
      ],
      quote: 'Every number we show carries its source and its timestamp. Everything else is decoration.',
      closing:
        'Read-only infrastructure is trust infrastructure. When your auditors, partners, and regulators can all check the same records independently, and none of them can change what they see, the record starts to speak for itself.',
    }),
  },
  {
    slug: 'reward-controls',
    title: 'Reward controls for honest verification work',
    titleLines: ['Reward controls for', 'honest verification'],
    category: 'Rewards',
    date: 'Oct 08, 2024',
    readTime: '4 min',
    image: '/art-06.png',
    excerpt:
      'Objective eligibility, anti-collusion controls, and transparent calculations, how verifier rewards stay honest by construction.',
    body: genericBody({
      lead: 'Paying people to check records creates an obvious hazard: rewards can distort the very judgment they are meant to encourage. ARCWELL’s reward system is built around a single principle, rewards pay for objectively valid data-quality work, never for reaching a preferred conclusion. Three controls keep that principle intact.',
      sections: [
        {
          index: '01',
          heading: 'Objective eligibility, not vibes',
          paragraphs: [
            'A reward is earned only when a finding meets written, checkable criteria: it identified a real discrepancy, cited evidence, and survived review. The rules are published before the work happens, so no verifier has to guess what counts, and no reviewer can quietly redefine it afterward.',
          ],
        },
        {
          index: '02',
          heading: 'Anti-collusion controls',
          paragraphs: [
            'The system watches for coordinated behavior: clusters of verifiers flagging in lockstep, reciprocal validation rings, sudden bursts against a single organization. Patterns that fail the controls are excluded from rewards and flagged for review. Legitimate collaboration is fine; synchronized theater is not, and the difference is visible in the data.',
          ],
        },
        {
          index: '03',
          heading: 'Transparent calculations, separate review',
          paragraphs: [
            'Every reward calculation is reproducible from public inputs: the finding, the criteria, the outcome of review. And the reward decision stays separate from any legal or compliance judgment about the underlying record, a verifier is paid for valid data-quality work, full stop. Anything beyond that belongs to the organization\'s own counsel and processes.',
          ],
        },
      ],
      quote: 'Rewards pay for valid data-quality work, never for reaching a preferred conclusion.',
      closing:
        'Incentive design is where verification systems usually fail quietly. Objective criteria, collusion detection, and transparent math are how we keep the quiet failure from ever becoming a loud one.',
    }),
  },
]

export function getArticle(slug: string | undefined): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

export function getRelated(article: Article, count = 3): Article[] {
  const idx = ARTICLES.findIndex((a) => a.slug === article.slug)
  const out: Article[] = []
  for (let n = 1; out.length < count && n <= ARTICLES.length; n++) {
    const next = ARTICLES[(idx + n) % ARTICLES.length]
    if (next.slug !== article.slug) out.push(next)
  }
  return out
}
