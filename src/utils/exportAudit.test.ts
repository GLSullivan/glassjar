import * as fs from 'fs';
import { describe, expect, test } from 'vitest';

import { migrateTransaction } from './migrateTransaction';
import { expandTransactionOccurrences, runProjection, MAX_PROJECTION_DAYS } from './projectionEngine';
import { addDaysToKey } from './dateKey';

/**
 * Real-data audit harness. Runs ONLY when GLASSJAR_EXPORT points at a local
 * Firebase RTDB export (never commit one). For every transaction of every
 * user it runs the true load path (migrateTransaction) and dumps 24 months
 * of generated occurrence DateKeys, so refactors can be diffed before/after
 * against production data:
 *
 *   GLASSJAR_EXPORT=path/to/export.json GLASSJAR_DUMP=out.json npx vitest run exportAudit
 */

const EXPORT_PATH = process.env.GLASSJAR_EXPORT;
const DUMP_PATH = process.env.GLASSJAR_DUMP;
const WIN_START = process.env.GLASSJAR_WIN_START || '2026-08-11';
const WIN_END = process.env.GLASSJAR_WIN_END || '2028-08-11';

describe.skipIf(!EXPORT_PATH)('export audit (local data, env-gated)', () => {
  test('every transaction migrates and expands without crashing; dump written', () => {
    const data = JSON.parse(fs.readFileSync(EXPORT_PATH!, 'utf8'));
    const dump: Record<string, string[]> = {};
    let count = 0;

    for (const [uid, user] of Object.entries<any>(data.users ?? {})) {
      for (const raw of (user.transactions ?? []).filter(Boolean)) {
        const migrated = migrateTransaction(raw);
        const key = `${uid}::${raw.event_id ?? raw.id}::${String(raw.transactionName ?? '').trim()}`;
        dump[key] = expandTransactionOccurrences(migrated, WIN_START, WIN_END).sort();
        count += 1;
      }
    }

    expect(count).toBeGreaterThan(0);
    if (DUMP_PATH) fs.writeFileSync(DUMP_PATH, JSON.stringify(dump, null, 1));
  });

  test('benchmark: full projection over real data at common ranges', () => {
    const data = JSON.parse(fs.readFileSync(EXPORT_PATH!, 'utf8'));
    // Largest user = the realistic worst case.
    const users = Object.values<any>(data.users ?? {});
    const biggest = users.reduce((a, b) =>
      (b.transactions?.length ?? 0) > (a.transactions?.length ?? 0) ? b : a);
    const transactions = (biggest.transactions ?? []).filter(Boolean).map(migrateTransaction);
    const accounts = (biggest.accounts ?? []).filter(Boolean);

    for (const days of [365, 365 * 3, 365 * 10, MAX_PROJECTION_DAYS]) {
      const input = {
        accounts,
        transactions,
        startKey: WIN_START,
        endKey: addDaysToKey(WIN_START, days - 1),
      };
      const start = performance.now();
      const result = runProjection(input);
      const cold = performance.now() - start;
      // Second run models every recalc after the first (occurrence memo warm).
      const startWarm = performance.now();
      runProjection(input);
      const warm = performance.now() - startWarm;
      const occurrences = Object.values(result.transactionsOnDate).reduce((n, list) => n + list.length, 0);
      // eslint-disable-next-line no-console
      console.log(`projection ${String(days).padStart(5)}d: cold ${cold.toFixed(0).padStart(5)}ms, warm ${warm.toFixed(0).padStart(5)}ms  (${accounts.length} accounts, ${transactions.length} transactions, ${occurrences} occurrences)`);
      expect(result.balanceByDateAndAccount).toBeTruthy();
    }
  });
});
