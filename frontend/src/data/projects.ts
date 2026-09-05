/**
 * ARCWELL record explorer data, mock RecordSeries anchored on ARC.
 * A RecordSeries groups related TransactionRecords and disclosure packages
 * submitted by one organization. Every entry below is fictional.
 */

export type RecordCategory = 'Registry' | 'Evidence' | 'Explorer' | 'Verifier' | 'API' | 'Corrections'

export type Filter = 'All' | RecordCategory

export type VerificationStatus = 'Verified' | 'Under review' | 'Disputed' | 'Corrected'

export type VisibilityPolicy = 'Public metadata' | 'Permissioned' | 'Encrypted'

export interface RecordStat {
  value: string
  label: string
}

/** Fields of a single representative TransactionRecord (evidence of an externally completed transaction). */
export interface TransactionRecordFields {
  submittingOrganization: string
  externalTransactionReference: string
  eventType: string
  eventTimestamp: string
  evidenceHash: string
  storageUri: string
  submitterSignature: string
  chainAnchor: string
  visibilityPolicy: VisibilityPolicy
  verificationStatus: VerificationStatus
  correctionHistory: string[]
  sourceSystemId: string
}

/** EvidenceBundle summary: links transaction IDs, signatures, timestamps, supporting documents. */
export interface EvidenceBundleSummary {
  transactionIds: number
  signatures: number
  timestamps: number
  documents: number
  retention: string
}

export interface RecordSeries {
  id: string
  index: string
  title: string
  category: RecordCategory
  image: string
  status: VerificationStatus
  summary: string
  stats: RecordStat[]
  record: TransactionRecordFields
  bundle: EvidenceBundleSummary
}

export const FILTERS: Filter[] = ['All', 'Registry', 'Evidence', 'Explorer', 'Verifier', 'API', 'Corrections']

export const RECORD_SERIES: RecordSeries[] = [
  {
    id: 'lumen',
    index: '01',
    title: 'Lumen',
    category: 'Registry',
    image: '/proj-01-lumen.png',
    status: 'Verified',
    summary:
      'Disclosure series for a manufacturing group, quarterly transaction records anchored on ARC with public metadata and permissioned source files.',
    stats: [
      { value: '1,284', label: 'Anchored transaction records' },
      { value: '312', label: 'Evidence bundles linked' },
      { value: '0 open', label: 'Disputes under review' },
    ],
    record: {
      submittingOrganization: 'Lumen Industrial Group',
      externalTransactionReference: 'EXT-LMN-2025-04417',
      eventType: 'Delivery confirmation',
      eventTimestamp: '2025-09-30T14:22:07Z',
      evidenceHash: '0x7f3a9c1e5b28d4f6071a93e8c2b4d6f8103a5c7e9b1d3f52748690acbe012345',
      storageUri: 'arc://evidence/lumen/bundle-0417',
      submitterSignature: '0x51e2…9ab4',
      chainAnchor: 'ARC block 18,442,117 · tx 0x8d21…f0c3',
      visibilityPolicy: 'Public metadata',
      verificationStatus: 'Verified',
      correctionHistory: [],
      sourceSystemId: 'SRC-LMN-ERP-04',
    },
    bundle: { transactionIds: 1284, signatures: 1284, timestamps: 2568, documents: 96, retention: '7 years · append-only' },
  },
  {
    id: 'helix',
    index: '02',
    title: 'Helix',
    category: 'Evidence',
    image: '/proj-02-helix.png',
    status: 'Verified',
    summary:
      'Evidence packaging workspace, content-addressed source documents, access logs, and retention rules for a logistics cooperative.',
    stats: [
      { value: '2,046', label: 'Evidence files sealed' },
      { value: '100%', label: 'Content-addressed coverage' },
      { value: '0', label: 'Unexplained access events' },
    ],
    record: {
      submittingOrganization: 'Helix Freight Cooperative',
      externalTransactionReference: 'EXT-HLX-2025-11802',
      eventType: 'Custody handoff record',
      eventTimestamp: '2025-10-02T08:41:53Z',
      evidenceHash: '0x2b8e4d6a0c1f3957b8d2e4f6a0c19375b8d2e4f6a0c19375b8d2e4f6a0c19375',
      storageUri: 'arc://evidence/helix/bundle-1180',
      submitterSignature: '0x77c1…e208',
      chainAnchor: 'ARC block 18,455,902 · tx 0x1b9f…44ae',
      visibilityPolicy: 'Permissioned',
      verificationStatus: 'Verified',
      correctionHistory: [],
      sourceSystemId: 'SRC-HLX-WMS-11',
    },
    bundle: { transactionIds: 2046, signatures: 2046, timestamps: 4092, documents: 211, retention: '10 years · append-only' },
  },
  {
    id: 'terra',
    index: '03',
    title: 'Terra',
    category: 'Explorer',
    image: '/proj-03-terra.png',
    status: 'Under review',
    summary:
      'Public record explorer configuration for a land-registry pilot, searchable metadata, provenance labels, and verification history per entry.',
    stats: [
      { value: '863', label: 'Publicly searchable records' },
      { value: '41', label: 'Verifier reviews logged' },
      { value: '3 open', label: 'Flags awaiting response' },
    ],
    record: {
      submittingOrganization: 'Terra Cadastral Office',
      externalTransactionReference: 'EXT-TER-2025-07210',
      eventType: 'Parcel record update',
      eventTimestamp: '2025-08-19T16:05:31Z',
      evidenceHash: '0x9d04c7a2e5b81f3649c0d2e4f6a8b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5',
      storageUri: 'arc://evidence/terra/bundle-0721',
      submitterSignature: '0x03dd…61f7',
      chainAnchor: 'ARC block 18,391,554 · tx 0x6e40…b812',
      visibilityPolicy: 'Public metadata',
      verificationStatus: 'Under review',
      correctionHistory: ['2025-09-02, COR-0144: participant reference amended; original entry preserved.'],
      sourceSystemId: 'SRC-TER-GIS-02',
    },
    bundle: { transactionIds: 863, signatures: 863, timestamps: 1727, documents: 148, retention: '25 years · append-only' },
  },
  {
    id: 'orbit',
    index: '04',
    title: 'Orbit',
    category: 'Explorer',
    image: '/proj-04-orbit.png',
    status: 'Verified',
    summary:
      'Record set for a cross-border supply network, provenance timelines and clear source labels on every disclosed entry.',
    stats: [
      { value: '1,509', label: 'Records with provenance trail' },
      { value: '18', label: 'Source systems attributed' },
      { value: '99.4%', label: 'Verifier agreement rate' },
    ],
    record: {
      submittingOrganization: 'Orbit Supply Network',
      externalTransactionReference: 'EXT-ORB-2025-09334',
      eventType: 'Shipment receipt attestation',
      eventTimestamp: '2025-09-11T11:37:44Z',
      evidenceHash: '0x4f1a6c8e0b2d4f6a8c0e2a4c6e8a0c2e4a6c8e0b2d4f6a8c0e2a4c6e8a0c2e4a',
      storageUri: 'arc://evidence/orbit/bundle-0933',
      submitterSignature: '0x29f0…c7d1',
      chainAnchor: 'ARC block 18,410,276 · tx 0xd353…7e90',
      visibilityPolicy: 'Public metadata',
      verificationStatus: 'Verified',
      correctionHistory: [],
      sourceSystemId: 'SRC-ORB-TMS-07',
    },
    bundle: { transactionIds: 1509, signatures: 1509, timestamps: 3018, documents: 87, retention: '7 years · append-only' },
  },
  {
    id: 'pulse',
    index: '05',
    title: 'Pulse',
    category: 'Verifier',
    image: '/proj-05-pulse.png',
    status: 'Disputed',
    summary:
      'Verifier workspace for a clinical-operations dataset, structured findings, challenge submission, and appeal history in the open.',
    stats: [
      { value: '57', label: 'Structured findings filed' },
      { value: '12', label: 'Challenges resolved' },
      { value: '1 open', label: 'Dispute in appeal window' },
    ],
    record: {
      submittingOrganization: 'Pulse Clinical Operations',
      externalTransactionReference: 'EXT-PLS-2025-05561',
      eventType: 'Equipment transfer log',
      eventTimestamp: '2025-07-28T09:14:02Z',
      evidenceHash: '0x81c3e5a7091b3d5f7a9c1e3a5c7e9a1c3e5a7c9e1b3d5f7a9c1e3a5c7e9a1c3e',
      storageUri: 'arc://evidence/pulse/bundle-0556',
      submitterSignature: '0x4aa8…30be',
      chainAnchor: 'ARC block 18,288,431 · tx 0x92c6…1d5f',
      visibilityPolicy: 'Permissioned',
      verificationStatus: 'Disputed',
      correctionHistory: [
        '2025-08-15, COR-0207: event timestamp contested by verifier V-114; under review.',
        '2025-08-30, COR-0211: supporting document re-attached; original hash preserved.',
      ],
      sourceSystemId: 'SRC-PLS-EAM-03',
    },
    bundle: { transactionIds: 977, signatures: 977, timestamps: 1954, documents: 164, retention: '15 years · append-only' },
  },
  {
    id: 'north',
    index: '06',
    title: 'North',
    category: 'API',
    image: '/proj-06-north.png',
    status: 'Verified',
    summary:
      'Read-only data services for an environmental monitoring program, API feeds, webhooks, and exportable audit reports with source attribution.',
    stats: [
      { value: '3,412', label: 'Records served via read-only API' },
      { value: '26', label: 'Active webhook subscribers' },
      { value: '0', label: 'Write paths exposed' },
    ],
    record: {
      submittingOrganization: 'North Environmental Trust',
      externalTransactionReference: 'EXT-NRT-2025-12087',
      eventType: 'Sensor reading batch anchor',
      eventTimestamp: '2025-10-05T05:52:18Z',
      evidenceHash: '0x0e6b8d1a3c5e7f9a1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e',
      storageUri: 'arc://evidence/north/bundle-1208',
      submitterSignature: '0x6e14…f952',
      chainAnchor: 'ARC block 18,461,088 · tx 0x40ab…c673',
      visibilityPolicy: 'Public metadata',
      verificationStatus: 'Verified',
      correctionHistory: [],
      sourceSystemId: 'SRC-NRT-IOT-19',
    },
    bundle: { transactionIds: 3412, signatures: 3412, timestamps: 6824, documents: 42, retention: '20 years · append-only' },
  },
  {
    id: 'sona',
    index: '07',
    title: 'Sona',
    category: 'Verifier',
    image: '/proj-07-sona.png',
    status: 'Corrected',
    summary:
      'Independent verification pool for a rights-management ledger, evidence comparison and reputation-scored findings.',
    stats: [
      { value: '1,130', label: 'Records independently reviewed' },
      { value: '94.7%', label: 'Verifier accuracy score' },
      { value: '4', label: 'Corrections accepted onchain' },
    ],
    record: {
      submittingOrganization: 'Sona Rights Collective',
      externalTransactionReference: 'EXT-SNA-2025-03449',
      eventType: 'Usage report attestation',
      eventTimestamp: '2025-06-14T19:48:26Z',
      evidenceHash: '0xb2d4f6a8c0e1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3',
      storageUri: 'arc://evidence/sona/bundle-0344',
      submitterSignature: '0x8b37…d406',
      chainAnchor: 'ARC block 18,176,905 · tx 0x7f58…e2b9',
      visibilityPolicy: 'Public metadata',
      verificationStatus: 'Corrected',
      correctionHistory: [
        '2025-07-01, COR-0098: duplicate event reference merged; both entries remain visible.',
        '2025-07-22, COR-0103: participant reference updated after verifier finding F-3312.',
      ],
      sourceSystemId: 'SRC-SNA-ROY-01',
    },
    bundle: { transactionIds: 1130, signatures: 1130, timestamps: 2262, documents: 73, retention: '10 years · append-only' },
  },
  {
    id: 'atlas',
    index: '08',
    title: 'Atlas',
    category: 'Registry',
    image: '/proj-08-atlas.png',
    status: 'Verified',
    summary:
      'Onchain registry deployment for an infrastructure consortium, record identifiers, submitter signatures, and correction links on ARC.',
    stats: [
      { value: '2,760', label: 'Registry entries anchored' },
      { value: '1.8s', label: 'Median confirmation time' },
      { value: '0', label: 'Gaps in anchor sequence' },
    ],
    record: {
      submittingOrganization: 'Atlas Infrastructure Consortium',
      externalTransactionReference: 'EXT-ATL-2025-10773',
      eventType: 'Milestone completion record',
      eventTimestamp: '2025-09-24T13:09:55Z',
      evidenceHash: '0x5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c',
      storageUri: 'arc://evidence/atlas/bundle-1077',
      submitterSignature: '0x1fc9…77a0',
      chainAnchor: 'ARC block 18,430,662 · tx 0xbe14…5d38',
      visibilityPolicy: 'Permissioned',
      verificationStatus: 'Verified',
      correctionHistory: [],
      sourceSystemId: 'SRC-ATL-PMO-06',
    },
    bundle: { transactionIds: 2760, signatures: 2760, timestamps: 5520, documents: 190, retention: '30 years · append-only' },
  },
  {
    id: 'ember',
    index: '09',
    title: 'Ember',
    category: 'Evidence',
    image: '/proj-09-ember.png',
    status: 'Under review',
    summary:
      'Evidence storage configuration for an energy metering program, encrypted source files, retention rules, and access logging.',
    stats: [
      { value: '1,672', label: 'Encrypted evidence objects' },
      { value: '100%', label: 'Access events logged' },
      { value: '2 open', label: 'Verifier queries pending' },
    ],
    record: {
      submittingOrganization: 'Ember Energy Cooperative',
      externalTransactionReference: 'EXT-EMB-2025-08215',
      eventType: 'Meter reading reconciliation',
      eventTimestamp: '2025-08-30T22:31:40Z',
      evidenceHash: '0xc3e5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5',
      storageUri: 'arc://evidence/ember/bundle-0821',
      submitterSignature: '0x55d2…8c14',
      chainAnchor: 'ARC block 18,375,219 · tx 0x09e7…a4f6',
      visibilityPolicy: 'Encrypted',
      verificationStatus: 'Under review',
      correctionHistory: ['2025-09-18, COR-0176: reading unit label corrected; underlying hash unchanged.'],
      sourceSystemId: 'SRC-EMB-MDM-09',
    },
    bundle: { transactionIds: 1672, signatures: 1672, timestamps: 3344, documents: 129, retention: '12 years · append-only' },
  },
  {
    id: 'vector',
    index: '10',
    title: 'Vector',
    category: 'API',
    image: '/proj-10-vector.png',
    status: 'Verified',
    summary:
      'Data services integration for a research-data exchange, exportable audit reports, monitoring, and source attribution at every field.',
    stats: [
      { value: '4,018', label: 'Audit reports exported' },
      { value: '120ms', label: 'Median API response time' },
      { value: '99.99%', label: 'Read API uptime (12 mo)' },
    ],
    record: {
      submittingOrganization: 'Vector Research Exchange',
      externalTransactionReference: 'EXT-VCT-2025-09930',
      eventType: 'Dataset publication record',
      eventTimestamp: '2025-09-16T07:26:11Z',
      evidenceHash: '0x6d8f0a2c4e6a8c0e2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f',
      storageUri: 'arc://evidence/vector/bundle-0993',
      submitterSignature: '0xa360…4de9',
      chainAnchor: 'ARC block 18,405,347 · tx 0x5c82…90b1',
      visibilityPolicy: 'Public metadata',
      verificationStatus: 'Verified',
      correctionHistory: [],
      sourceSystemId: 'SRC-VCT-RDM-12',
    },
    bundle: { transactionIds: 4018, signatures: 4018, timestamps: 8036, documents: 58, retention: '10 years · append-only' },
  },
  {
    id: 'halo',
    index: '11',
    title: 'Halo',
    category: 'Corrections',
    image: '/proj-11-halo.png',
    status: 'Corrected',
    summary:
      'Correction trail for a provenance-tracking program, every amendment appended onchain, originals never deleted.',
    stats: [
      { value: '9', label: 'Corrections appended onchain' },
      { value: '100%', label: 'Originals preserved' },
      { value: '14 days', label: 'Median dispute resolution' },
    ],
    record: {
      submittingOrganization: 'Halo Provenance Lab',
      externalTransactionReference: 'EXT-HAL-2025-06118',
      eventType: 'Custody transfer attestation',
      eventTimestamp: '2025-07-09T15:57:03Z',
      evidenceHash: '0x3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a',
      storageUri: 'arc://evidence/halo/bundle-0611',
      submitterSignature: '0x72e8…b5c0',
      chainAnchor: 'ARC block 18,220,784 · tx 0x31fa…6e27',
      visibilityPolicy: 'Public metadata',
      verificationStatus: 'Corrected',
      correctionHistory: [
        '2025-07-25, COR-0052: event type reclassified after review; original entry preserved.',
        '2025-08-08, COR-0071: supporting document versioned v1 → v2; both hashes linked.',
      ],
      sourceSystemId: 'SRC-HAL-PLM-02',
    },
    bundle: { transactionIds: 745, signatures: 745, timestamps: 1499, documents: 103, retention: '15 years · append-only' },
  },
  {
    id: 'drift',
    index: '12',
    title: 'Drift',
    category: 'Corrections',
    image: '/proj-12-drift.png',
    status: 'Disputed',
    summary:
      'Append-only dispute ledger for a fleet-operations network, challenges, responses, and appeal outcomes in one transparent trail.',
    stats: [
      { value: '23', label: 'Challenges filed to date' },
      { value: '19', label: 'Resolved without escalation' },
      { value: '2 open', label: 'Appeals in progress' },
    ],
    record: {
      submittingOrganization: 'Drift Fleet Operations',
      externalTransactionReference: 'EXT-DRF-2025-11456',
      eventType: 'Vehicle handover record',
      eventTimestamp: '2025-09-27T10:12:49Z',
      evidenceHash: '0xa1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3',
      storageUri: 'arc://evidence/drift/bundle-1145',
      submitterSignature: '0xd047…e8b3',
      chainAnchor: 'ARC block 18,436,510 · tx 0x87bd…2c59',
      visibilityPolicy: 'Permissioned',
      verificationStatus: 'Disputed',
      correctionHistory: [
        '2025-10-01, COR-0233: odometer field challenged by verifier V-209; evidence under comparison.',
      ],
      sourceSystemId: 'SRC-DRF-FMS-05',
    },
    bundle: { transactionIds: 1210, signatures: 1210, timestamps: 2420, documents: 81, retention: '8 years · append-only' },
  },
]
