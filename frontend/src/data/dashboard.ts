/**
 * ARCWELL on ARC, dashboard mock data.
 * Follows the content-map data model: OrganizationProfile, RecordSeries,
 * TransactionRecord, EvidenceBundle, ValidationResult, verifier reputation,
 * correction trail, reward rules, disclaimer / boundary memo.
 * All data is client-side mock, generated deterministically with a seeded PRNG.
 */

export type VerificationStatus = 'anchored' | 'verified' | 'flagged' | 'corrected' | 'pending'
export type VisibilityPolicy = 'public' | 'permissioned' | 'sealed'
export type OrgStatus = 'active' | 'probation' | 'suspended'
export type SeriesCategory = 'Registry' | 'Evidence' | 'Explorer' | 'Verifier' | 'API' | 'Corrections'

export interface OrganizationProfile {
  id: string
  code: string
  name: string
  role: string
  jurisdiction: string
  authorization: 'anchor + submit' | 'submit-only' | 'read-only'
  status: OrgStatus
  recordsSubmitted: number
  anchorsSubmitted: number
  openFlags: number
  visibilityDefault: VisibilityPolicy
  joinedAt: string
  lastActiveAt: string
}

export interface RecordSeries {
  id: string
  code: string
  name: string
  category: SeriesCategory
  organizationId: string
  visibilityPolicy: VisibilityPolicy
  recordCount: number
  anchorCount: number
  openFlags: number
  lastAnchorAt: string
  status: 'anchoring' | 'steady' | 'under-review'
}

export interface ChainAnchor {
  slot: number
  hash: string
  blockTime: string
}

export interface TransactionRecord {
  id: string
  seriesId: string
  organizationId: string
  externalRef: string
  eventType: string
  eventTimestamp: string
  evidenceHash: string
  storageUri: string
  submitterSignature: string
  chainAnchor: ChainAnchor
  visibilityPolicy: VisibilityPolicy
  verificationStatus: VerificationStatus
  correctionCount: number
  sourceSystem: string
}

export interface ValidationResult {
  id: string
  recordId: string
  source: string
  ruleSet: string
  checkedAt: string
  outcome: 'pass' | 'warn' | 'fail'
  detail: string
}

export interface EvidenceAccess {
  actor: string
  action: 'read' | 'attest' | 'export' | 'rotate-key'
  at: string
}

export interface EvidenceBundle {
  id: string
  transactionIds: string[]
  storageUri: string
  contentHash: string
  encryption: string
  documentCount: number
  sizeBytes: number
  retentionUntil: string
  accessLog: EvidenceAccess[]
}

export interface Verifier {
  id: string
  handle: string
  tier: 'T1' | 'T2' | 'T3'
  reputation: number
  accuracy: number
  reviews: number
  openChallenges: number
  appealsWon: number
  appealsLost: number
  joinedAt: string
  status: 'active' | 'paused' | 'review'
}

export interface VerifierFinding {
  id: string
  verifierId: string
  recordId: string
  kind: 'discrepancy' | 'confirmation' | 'note'
  severity: 'low' | 'medium' | 'high'
  summary: string
  submittedAt: string
  status: 'open' | 'upheld' | 'dismissed' | 'appealed'
}

export interface CorrectionEvent {
  id: string
  recordId: string
  seriesId: string
  kind: 'dispute' | 'correction' | 'annotation'
  reason: string
  requestedBy: string
  submittedAt: string
  resolvedAt: string | null
  status: 'open' | 'appended' | 'rejected'
  supersedes: string | null
  hash: string
}

export interface RewardRule {
  id: string
  name: string
  description: string
  baseReward: number
  unit: string
  cap: string
  eligibility: string
  antiCollusion: string
}

export interface ApiKey {
  id: string
  label: string
  prefix: string
  createdAt: string
  lastUsedAt: string
  scopes: string[]
  status: 'active' | 'revoked'
  requests30d: number
}

export interface Webhook {
  id: string
  event: string
  endpoint: string
  enabled: boolean
  deliveries: number
  failures: number
}

export interface AnchorFeedItem {
  id: string
  kind: 'anchor' | 'verification' | 'correction' | 'flag'
  ref: string
  detail: string
  slot: number
  at: string
}

/* ------------------------------------------------------------------ */
/* Deterministic PRNG + helpers                                        */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(0xa2c)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min

const HEX = '0123456789abcdef'
function hex(len: number): string {
  let s = ''
  for (let i = 0; i < len; i++) s += HEX[Math.floor(rand() * 16)]
  return s
}
const hash64 = () => hex(64)
const sig = () => hex(96)

/** Deterministic ISO timestamps spread across Oct-Dec 2025. */
function ts(day: number, hour: number, minute = 0): string {
  const month = day > 61 ? '10' : day > 30 ? '11' : '12'
  const d = month === '10' ? day - 61 : month === '11' ? day - 30 : day
  const dd = String(Math.min(d, month === '10' ? 31 : month === '11' ? 30 : 18)).padStart(2, '0')
  return `2025-${month}-${dd}T${String(hour % 24).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00Z`
}

let dayCursor = 0
function nextTs(): string {
  dayCursor += 1 + Math.floor(rand() * 3)
  return ts(dayCursor, int(0, 23), int(0, 59))
}

/* ------------------------------------------------------------------ */
/* Organizations                                                       */
/* ------------------------------------------------------------------ */

const ORG_SEED = [
  ['ORG-LMN', 'Lumen Field Operations', 'Record originator', 'CA-ON'],
  ['ORG-HLX', 'Helix Ledger Systems', 'Submitting organization', 'US-NY'],
  ['ORG-TRA', 'Terra Forma Registry', 'Record originator', 'DE-BE'],
  ['ORG-ORB', 'Orbit Fulfilment Group', 'Submitting organization', 'UK-LDN'],
  ['ORG-PLS', 'Pulse Clinical Logistics', 'Record originator', 'US-CA'],
  ['ORG-NTH', 'Northbound Supply Cooperative', 'Submitting organization', 'CA-BC'],
  ['ORG-SNA', 'Sona Rights Registry', 'Record originator', 'SE-STO'],
  ['ORG-ATL', 'Atlas Freight Bureau', 'Submitting organization', 'NL-AMS'],
  ['ORG-EMB', 'Ember & Oak Provenance', 'Record originator', 'US-OR'],
] as const

export const ORGANIZATIONS: OrganizationProfile[] = ORG_SEED.map(([code, name, role, jur], i) => ({
  id: `org-${String(i + 1).padStart(3, '0')}`,
  code,
  name,
  role,
  jurisdiction: jur,
  authorization: pick(['anchor + submit', 'anchor + submit', 'submit-only', 'read-only'] as const),
  status: i === 6 ? 'probation' : i === 8 ? 'suspended' : 'active',
  recordsSubmitted: int(40, 900),
  anchorsSubmitted: int(30, 700),
  openFlags: int(0, 6),
  visibilityDefault: pick(['public', 'permissioned', 'permissioned', 'sealed'] as const),
  joinedAt: ts(int(1, 20), int(8, 17)),
  lastActiveAt: nextTs(),
}))

/* ------------------------------------------------------------------ */
/* RecordSeries (12 case files / datasets)                             */
/* ------------------------------------------------------------------ */

const SERIES_SEED: Array<[string, string, SeriesCategory, number]> = [
  ['RS-LMN', 'Lumen, field calibration records', 'Registry', 0],
  ['RS-HLX', 'Helix, ledger reconciliation set', 'Registry', 1],
  ['RS-TRA', 'Terra, parcel survey disclosure package', 'Evidence', 2],
  ['RS-ORB', 'Orbit, fulfilment event dataset', 'Evidence', 3],
  ['RS-PLS', 'Pulse, cold-chain transit case file', 'Verifier', 4],
  ['RS-NTH', 'Northbound, cooperative intake records', 'Registry', 5],
  ['RS-SNA', 'Sona, rights assignment dataset', 'API', 6],
  ['RS-ATL', 'Atlas, freight handoff case file', 'Explorer', 7],
  ['RS-EMB', 'Ember, provenance disclosure package', 'Evidence', 8],
  ['RS-VCT', 'Vector, build attestation record set', 'API', 1],
  ['RS-HLO', 'Halo, custody-transfer event log', 'Corrections', 2],
  ['RS-DRF', 'Drift, fleet telemetry record set', 'Explorer', 4],
]

export const RECORD_SERIES: RecordSeries[] = SERIES_SEED.map(([code, name, category, orgIdx], i) => {
  const recordCount = int(24, 260)
  return {
    id: `rs-${String(i + 1).padStart(3, '0')}`,
    code,
    name,
    category,
    organizationId: ORGANIZATIONS[orgIdx].id,
    visibilityPolicy: pick(['public', 'public', 'permissioned', 'sealed'] as const),
    recordCount,
    anchorCount: Math.max(1, recordCount - int(0, 12)),
    openFlags: int(0, 5),
    lastAnchorAt: nextTs(),
    status: pick(['steady', 'steady', 'anchoring', 'under-review'] as const),
  }
})

/* ------------------------------------------------------------------ */
/* TransactionRecords                                                  */
/* ------------------------------------------------------------------ */

const EVENT_TYPES = [
  'record submission',
  'evidence packaging',
  'proof anchoring',
  'attestation',
  'record finalization',
  'visibility update',
] as const

const SOURCE_SYSTEMS = ['ERP-connector v2.4', 'Manual portal entry', 'SFTP batch ingest', 'Partner API relay'] as const
const TX_STATUSES: VerificationStatus[] = ['verified', 'verified', 'verified', 'anchored', 'anchored', 'pending', 'flagged', 'corrected']

export const TRANSACTIONS: TransactionRecord[] = Array.from({ length: 56 }, (_, i) => {
  const series = RECORD_SERIES[i % RECORD_SERIES.length]
  const org = ORGANIZATIONS.find((o) => o.id === series.organizationId) ?? ORGANIZATIONS[0]
  const status = pick(TX_STATUSES)
  const eventAt = nextTs()
  const anchorAt = ts(dayCursor + 1, int(0, 23), int(0, 59))
  return {
    id: `tx-${String(i + 1).padStart(4, '0')}`,
    seriesId: series.id,
    organizationId: org.id,
    externalRef: `EXT-${series.code.slice(3)}-${String(1000 + i * 7)}`,
    eventType: pick(EVENT_TYPES),
    eventTimestamp: eventAt,
    evidenceHash: hash64(),
    storageUri: `arc-store://evidence/${hex(12)}/${series.code.toLowerCase()}`,
    submitterSignature: sig(),
    chainAnchor: { slot: 284_110_000 + i * 913 + int(0, 400), hash: hash64(), blockTime: anchorAt },
    visibilityPolicy: series.visibilityPolicy,
    verificationStatus: status,
    correctionCount: status === 'corrected' ? int(1, 3) : status === 'flagged' ? int(0, 1) : 0,
    sourceSystem: pick(SOURCE_SYSTEMS),
  }
})

/* ------------------------------------------------------------------ */
/* ValidationResults                                                   */
/* ------------------------------------------------------------------ */

const VALIDATION_SOURCES = ['ARC registry scanner', 'Third-party rule engine (Meridian)', 'Hash-continuity monitor', 'Verifier consensus pass'] as const
const RULE_SETS = ['ARC-SCHEMA-1.2', 'EVIDENCE-INTEGRITY-3', 'TEMPORAL-ORDER-1', 'DUP-DETECT-0.9'] as const

export const VALIDATIONS: ValidationResult[] = TRANSACTIONS.filter((_, i) => i % 2 === 0).map((tx, i) => {
  const outcome = tx.verificationStatus === 'flagged' ? 'fail' : tx.verificationStatus === 'pending' ? 'warn' : 'pass'
  return {
    id: `val-${String(i + 1).padStart(3, '0')}`,
    recordId: tx.id,
    source: pick(VALIDATION_SOURCES),
    ruleSet: pick(RULE_SETS),
    checkedAt: ts(dayCursor + int(0, 2), int(0, 23), int(0, 59)),
    outcome,
    detail:
      outcome === 'pass'
        ? 'Evidence hash matches anchored digest; temporal order intact.'
        : outcome === 'warn'
          ? 'Awaiting second confirmation before outcome is final.'
          : 'Source-system identifier mismatch against submitted metadata. Informational only, not a legal determination.',
  }
})

/* ------------------------------------------------------------------ */
/* EvidenceBundles                                                     */
/* ------------------------------------------------------------------ */

export const EVIDENCE_BUNDLES: EvidenceBundle[] = Array.from({ length: 14 }, (_, i) => {
  const txSlice = TRANSACTIONS.slice(i * 3, i * 3 + int(2, 4))
  return {
    id: `evb-${String(i + 1).padStart(3, '0')}`,
    transactionIds: txSlice.map((t) => t.id),
    storageUri: `arc-store://evidence/${hex(16)}`,
    contentHash: hash64(),
    encryption: pick(['AES-256-GCM, org-held keys', 'AES-256-GCM, threshold escrow', 'None, public artifact'] as const),
    documentCount: int(2, 18),
    sizeBytes: int(240_000, 96_000_000),
    retentionUntil: `20${int(28, 32)}-${String(int(1, 12)).padStart(2, '0')}-01T00:00:00Z`,
    accessLog: Array.from({ length: int(2, 5) }, () => ({
      actor: pick(['org-portal', 'verifier:glcn-04', 'verifier:mnd-11', 'audit-export', 'api:read-only'] as const),
      action: pick(['read', 'read', 'attest', 'export', 'rotate-key'] as const),
      at: nextTs(),
    })).sort((a, b) => a.at.localeCompare(b.at)),
  }
})

/* ------------------------------------------------------------------ */
/* Verifiers + findings                                                */
/* ------------------------------------------------------------------ */

const VERIFIER_SEED = [
  ['glcn-04', 'T1'], ['mnd-11', 'T2'], ['kpr-02', 'T1'], ['vtl-09', 'T3'],
  ['obs-17', 'T2'], ['frq-23', 'T1'], ['hzn-31', 'T2'], ['plr-07', 'T3'],
] as const

export const VERIFIERS: Verifier[] = VERIFIER_SEED.map(([handle, tier], i) => ({
  id: `vrf-${String(i + 1).padStart(3, '0')}`,
  handle,
  tier: tier as Verifier['tier'],
  reputation: int(62, 99),
  accuracy: 88 + rand() * 11.5,
  reviews: int(24, 620),
  openChallenges: int(0, 4),
  appealsWon: int(0, 6),
  appealsLost: int(0, 3),
  joinedAt: ts(int(1, 30), int(8, 17)),
  status: i === 5 ? 'paused' : i === 7 ? 'review' : 'active',
}))

const FINDING_SUMMARIES: Record<VerifierFinding['kind'], string[]> = {
  discrepancy: [
    'Timestamp on source artifact precedes the reported event window.',
    'Document count in bundle does not match the submitted manifest.',
    'External reference appears in two series with different evidence hashes.',
  ],
  confirmation: [
    'Evidence hash re-computed independently, matches anchored digest.',
    'Source-system export cross-checked; fields consistent with record.',
    'Correction chain resolves cleanly to the current record version.',
  ],
  note: [
    'Visibility policy changed twice within one anchoring window, worth watching.',
    'Retention date on one artifact is earlier than the series default.',
    'Submitter signature scheme rotated; previous key still valid for history.',
  ],
}

export const FINDINGS: VerifierFinding[] = Array.from({ length: 16 }, (_, i) => {
  const kind = pick(['confirmation', 'confirmation', 'discrepancy', 'note'] as const)
  const status = kind === 'discrepancy' ? pick(['open', 'open', 'upheld', 'appealed'] as const) : pick(['upheld', 'dismissed', 'open'] as const)
  return {
    id: `fnd-${String(i + 1).padStart(3, '0')}`,
    verifierId: VERIFIERS[i % VERIFIERS.length].id,
    recordId: TRANSACTIONS[(i * 3 + 1) % TRANSACTIONS.length].id,
    kind,
    severity: kind === 'discrepancy' ? pick(['medium', 'high', 'low'] as const) : pick(['low', 'low', 'medium'] as const),
    summary: pick(FINDING_SUMMARIES[kind]),
    submittedAt: nextTs(),
    status,
  }
})

/* ------------------------------------------------------------------ */
/* Correction trail (append-only)                                      */
/* ------------------------------------------------------------------ */

const CORRECTION_REASONS = [
  'Submitter reported an incorrect external reference; corrected entry appended, original preserved.',
  'Evidence bundle re-packaged after verifier finding; new content hash anchored.',
  'Event timestamp clarified by source system; annotation appended with both values.',
  'Visibility policy narrowed pending organization review; change logged.',
  'Duplicate submission detected; superseding record linked, original retained.',
] as const

export const CORRECTIONS: CorrectionEvent[] = Array.from({ length: 12 }, (_, i) => {
  const kind = pick(['correction', 'correction', 'dispute', 'annotation'] as const)
  const status = i < 3 ? 'open' : pick(['appended', 'appended', 'appended', 'rejected'] as const)
  const submitted = nextTs()
  return {
    id: `cor-${String(i + 1).padStart(3, '0')}`,
    recordId: TRANSACTIONS[(i * 5 + 2) % TRANSACTIONS.length].id,
    seriesId: RECORD_SERIES[i % RECORD_SERIES.length].id,
    kind,
    reason: pick(CORRECTION_REASONS),
    requestedBy: pick(['submitting organization', 'verifier challenge', 'integrity monitor'] as const),
    submittedAt: submitted,
    resolvedAt: status === 'open' ? null : ts(dayCursor + 1, int(0, 23), int(0, 59)),
    status,
    supersedes: status === 'appended' && kind === 'correction' ? `tx-${String(((i * 5 + 2) % TRANSACTIONS.length) + 1).padStart(4, '0')}` : null,
    hash: hash64(),
  }
})

/* ------------------------------------------------------------------ */
/* Anchors feed + network status                                       */
/* ------------------------------------------------------------------ */

export const ANCHOR_FEED: AnchorFeedItem[] = Array.from({ length: 18 }, (_, i) => {
  const kind = pick(['anchor', 'anchor', 'anchor', 'verification', 'correction', 'flag'] as const)
  const series = RECORD_SERIES[i % RECORD_SERIES.length]
  return {
    id: `feed-${String(i + 1).padStart(3, '0')}`,
    kind,
    ref: kind === 'anchor' ? series.code : TRANSACTIONS[(i * 3) % TRANSACTIONS.length].id,
    detail:
      kind === 'anchor'
        ? `${int(2, 40)} record digests anchored to ARC`
        : kind === 'verification'
          ? 'Verifier consensus reached on submitted evidence'
          : kind === 'correction'
            ? 'Correction appended; original entry preserved'
            : 'Discrepancy flag raised by verifier workspace',
    slot: 284_318_000 + i * 401 + int(0, 120),
    at: ts(92, Math.max(0, 17 - Math.floor(i / 2)), (58 - i * 3 + 60) % 60),
  }
}).sort((a, b) => b.at.localeCompare(a.at))

export const NETWORK_STATUS = {
  network: 'ARC mainnet',
  state: 'operational' as 'operational' | 'degraded',
  currentSlot: 284_325_412,
  avgConfirmationMs: 412,
  anchors24h: 1_284,
  records24h: 3_912,
  uptime30d: 99.98,
  slotHistory: Array.from({ length: 32 }, (_, i) => 380 + Math.round(Math.sin(i / 3) * 60 + rand() * 90)),
}

/* ------------------------------------------------------------------ */
/* API & Rewards                                                       */
/* ------------------------------------------------------------------ */

export const API_KEYS: ApiKey[] = [
  { id: 'key-01', label: 'Explorer read replica', prefix: 'arc_ro_7f3a', createdAt: '2025-10-04T09:12:00Z', lastUsedAt: '2025-12-18T14:02:00Z', scopes: ['records:read', 'series:read'], status: 'active', requests30d: 184_203 },
  { id: 'key-02', label: 'Audit report exporter', prefix: 'arc_ro_29cd', createdAt: '2025-10-19T11:40:00Z', lastUsedAt: '2025-12-17T08:31:00Z', scopes: ['records:read', 'evidence:read', 'exports:create'], status: 'active', requests30d: 12_488 },
  { id: 'key-03', label: 'Verifier workspace sync', prefix: 'arc_ro_b51e', createdAt: '2025-11-02T16:05:00Z', lastUsedAt: '2025-12-18T12:57:00Z', scopes: ['findings:read', 'findings:write'], status: 'active', requests30d: 46_771 },
  { id: 'key-04', label: 'Legacy sandbox (rotated)', prefix: 'arc_ro_00aa', createdAt: '2025-09-12T10:00:00Z', lastUsedAt: '2025-11-20T19:44:00Z', scopes: ['records:read'], status: 'revoked', requests30d: 0 },
]

export const WEBHOOKS: Webhook[] = [
  { id: 'wh-01', event: 'record.anchored', endpoint: 'https://ops.example.org/hooks/arcwell/anchored', enabled: true, deliveries: 3_204, failures: 2 },
  { id: 'wh-02', event: 'finding.submitted', endpoint: 'https://ops.example.org/hooks/arcwell/findings', enabled: true, deliveries: 812, failures: 0 },
  { id: 'wh-03', event: 'correction.appended', endpoint: 'https://ops.example.org/hooks/arcwell/corrections', enabled: false, deliveries: 144, failures: 1 },
  { id: 'wh-04', event: 'validation.completed', endpoint: 'https://ops.example.org/hooks/arcwell/validations', enabled: true, deliveries: 5_631, failures: 7 },
]

export const REWARD_RULES: RewardRule[] = [
  {
    id: 'rw-01',
    name: 'Valid discrepancy, upheld',
    description: 'A verifier-submitted discrepancy that is reviewed and upheld against the record.',
    baseReward: 120,
    unit: 'ARC-CREDIT',
    cap: 'Max 3 upheld findings per record',
    eligibility: 'T1+ verifiers; finding must cite evidence hash and field-level diff.',
    antiCollusion: 'Submitter and verifier graphs screened for shared control signals; repeat pairings auto-flagged.',
  },
  {
    id: 'rw-02',
    name: 'Independent confirmation',
    description: 'Re-computation of an evidence hash that matches the anchored digest, with logged method.',
    baseReward: 8,
    unit: 'ARC-CREDIT',
    cap: 'Max 200 confirmations / verifier / epoch',
    eligibility: 'All active verifiers; one confirmation per record per verifier.',
    antiCollusion: 'Confirmations sampled for replay; synthetic re-submissions void the epoch.',
  },
  {
    id: 'rw-03',
    name: 'Correction stewardship',
    description: 'Shepherding a valid correction through the append-only trail to resolution.',
    baseReward: 40,
    unit: 'ARC-CREDIT',
    cap: 'Max 10 per epoch',
    eligibility: 'T2+ verifiers with ≥95% accuracy over trailing 90 days.',
    antiCollusion: 'Corrections requested by a linked organization are excluded from rewards.',
  },
  {
    id: 'rw-04',
    name: 'Data-quality annotation',
    description: 'Non-dispute annotations that materially improve record clarity (accepted by review).',
    baseReward: 15,
    unit: 'ARC-CREDIT',
    cap: 'Max 40 per epoch',
    eligibility: 'All active verifiers; acceptance by two independent reviewers required.',
    antiCollusion: 'Reviewer pairs rotated per epoch; self-review is structurally impossible.',
  },
]

/* ------------------------------------------------------------------ */
/* Boundary memo + disclaimer (verbatim from the content map)          */
/* ------------------------------------------------------------------ */

export const DISCLAIMER =
  'ARCWELL is a software and verification service. It does not issue, offer, sell, broker, custody, or settle securities; provide investment advice; determine whether an instrument is a security; or replace an organization\u2019s legal, regulatory, transfer-agent, broker-dealer, exchange, or recordkeeping obligations.'

export const BOUNDARY_MEMO = {
  title: 'Product boundary memo',
  summary:
    'ARCWELL is software for recording, anchoring, and verifying evidence of transactions that occurred through systems operated by other parties. An ARC entry proves specified data was submitted at a given time and has not been altered; it does not by itself prove the underlying transaction was lawful, valid, authorized, complete, or correctly classified.',
  does: [
    'Anchor transaction hashes and timestamps on ARC.',
    'Link records to supporting documents and source references.',
    'Preserve an append-only audit and correction history.',
    'Let authorized users submit and attest to records.',
    'Let verifiers review evidence and flag discrepancies.',
    'Provide read-only APIs and a public record explorer.',
    'Surface third-party rule or screening results with source and time.',
    'Reward objectively valid data-quality work, subject to separate review.',
  ],
  doesNot: [
    'Create or issue securities; offer, promote, or sell securities; match buyers and sellers.',
    'Transfer ownership of an underlying instrument; hold customer assets or act as custodian.',
    'Route investment payments or perform DvP settlement.',
    'Certify Reg D, Reg S, Reg CF, accreditation, sanctions, KYC approval, or legal compliance.',
    'Provide investment advice or guarantee transaction validity.',
  ],
  terminology: [
    ['record submission', 'not "securities issuance"'],
    ['transaction record / attested record', 'not "security token"'],
    ['submitting organization', 'not "issuer"'],
    ['authorized participant / viewer', 'not "investor"'],
    ['RecordSeries / case file', 'not "SecuritySeries"'],
    ['record explorer', 'not "marketplace"'],
    ['view / submit / verify / attest', 'not "buy / sell / subscribe"'],
    ['record finalization / proof anchoring', 'not "settlement"'],
  ] as Array<[string, string]>,
}

/* ------------------------------------------------------------------ */
/* Lookup helpers                                                      */
/* ------------------------------------------------------------------ */

export const orgById = (id: string) => ORGANIZATIONS.find((o) => o.id === id)
export const seriesById = (id: string) => RECORD_SERIES.find((s) => s.id === id)
export const verifierById = (id: string) => VERIFIERS.find((v) => v.id === id)

export const DASHBOARD_KPIS = {
  anchorsSubmitted: 18_442,
  recordsVerified: 16_907,
  organizations: ORGANIZATIONS.length,
  avgConfirmationMs: NETWORK_STATUS.avgConfirmationMs,
  verifierAccuracy: 97.4,
  openFlags: CORRECTIONS.filter((c) => c.status === 'open').length + FINDINGS.filter((f) => f.status === 'open').length,
}
