import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DASHBOARD_RELEASE,
  isDashboardViewEnabled,
  resolveDashboardView,
} from '../frontend/src/lib/dashboard-release.ts';

test('MVP accepts core routes and closes deferred or unknown deep links', () => {
  for (const view of ['portfolio', 'markets', 'trading', 'swap', 'ledger', 'arc', 'settings']) {
    assert.equal(resolveDashboardView(view), view);
  }
  for (const view of [
    'risk',
    'quant',
    'funding',
    'overview',
    'organizations',
    'series',
    'transactions',
    'evidence',
    'verifiers',
    'corrections',
    'api',
    'assets',
    'payments',
    'activity',
    'network',
    'integrations',
    '__proto__',
    'constructor',
    'unknown',
  ]) {
    assert.equal(isDashboardViewEnabled(view), false);
    assert.equal(resolveDashboardView(view), 'portfolio');
  }
  assert.equal(resolveDashboardView('boundary'), 'settings');
  assert.equal(resolveDashboardView(), 'portfolio');
});

test('a release switch exposes only its own deferred feature group', () => {
  const research = { ...DASHBOARD_RELEASE, quant: true };
  assert.equal(resolveDashboardView('quant', research), 'quant');
  assert.equal(resolveDashboardView('risk', research), 'portfolio');
  assert.equal(resolveDashboardView('payments', research), 'portfolio');
  const registry = { ...DASHBOARD_RELEASE, registry: true };
  assert.equal(resolveDashboardView('boundary', registry), 'boundary');
  assert.equal(resolveDashboardView('evidence', registry), 'evidence');
  assert.equal(resolveDashboardView('network', registry), 'portfolio');
});
