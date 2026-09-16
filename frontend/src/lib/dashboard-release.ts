// Release switches are changed in code and reviewed before deployment.
// They control product visibility, not authorization to sensitive data.
export const DASHBOARD_RELEASE = {
  risk: false,
  quant: false,
  funding: false,
  registry: false,
  arcTools: false,
} as const;

export type DashboardRelease = Record<keyof typeof DASHBOARD_RELEASE, boolean>;

const CORE_VIEWS = [
  "portfolio",
  "markets",
  "trading",
  "stocks",
  "swap",
  "ledger",
  "arc",
  "settings",
];
const DEFERRED_VIEWS: Record<string, keyof DashboardRelease> = {
  risk: "risk",
  quant: "quant",
  funding: "funding",
  overview: "registry",
  organizations: "registry",
  series: "registry",
  transactions: "registry",
  evidence: "registry",
  verifiers: "registry",
  corrections: "registry",
  api: "registry",
  boundary: "registry",
  assets: "arcTools",
  payments: "arcTools",
  activity: "arcTools",
  network: "arcTools",
  integrations: "arcTools",
};

export function isDashboardViewEnabled(
  view: string,
  release: DashboardRelease = DASHBOARD_RELEASE,
) {
  if (CORE_VIEWS.includes(view)) return true;
  return Object.hasOwn(DEFERRED_VIEWS, view) && release[DEFERRED_VIEWS[view]];
}

export function resolveDashboardView(view?: string, release: DashboardRelease = DASHBOARD_RELEASE) {
  if (view === "boundary" && !release.registry) return "settings";
  return view && isDashboardViewEnabled(view, release) ? view : "portfolio";
}

export function dashboardViewNumber(view: string) {
  const ordered = [
    "portfolio",
    "markets",
    "trading",
    "stocks",
    "swap",
    "risk",
    "quant",
    "funding",
    "ledger",
    "arc",
    "settings",
    ...Object.keys(DEFERRED_VIEWS).filter((id) => !["risk", "quant", "funding"].includes(id)),
  ].filter((id) => isDashboardViewEnabled(id));
  return String(ordered.indexOf(view) + 1).padStart(2, "0");
}
