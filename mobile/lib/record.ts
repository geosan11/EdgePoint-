import type { RecordPick } from './types';

export type RecordPeriod = '30d' | '90d' | 'all';

export interface RecordStats {
  totalPicks: number;
  settledPicks: number;
  wonCount: number;
  lostCount: number;
  pendingCount: number;
  recordFormatted: string; // e.g. "25–15"

  // 1. Beat closing line (% of settled picks where posted odds > closing odds)
  beatClosingCount: number;
  settledWithClosingCount: number;
  beatClosingPct: number;
  beatClosingFormatted: string;

  // 2. Hit rate (won / settled) vs average model probability
  hitRatePct: number;
  hitRateFormatted: string;
  avgModelProbPct: number;
  avgModelProbFormatted: string;

  // 3. Return per pick (flat 1 unit at posted odds)
  // Won: +(posted_odds - 1), Lost: -1 unit
  totalUnitsPnl: number;
  returnPerPickUnits: number;
  returnPerPickFormatted: string;
  roiPct: number;
  roiFormatted: string;
}

/**
 * Filter picks by relative timeframe (30d, 90d, or all).
 */
export function filterPicksByPeriod(
  picks: RecordPick[],
  period: RecordPeriod,
  now: Date = new Date()
): RecordPick[] {
  if (period === 'all') return [...picks];

  const days = period === '30d' ? 30 : 90;
  const cutoffTime = now.getTime() - days * 24 * 60 * 60 * 1000;

  return picks.filter((pick) => {
    const pickTime = new Date(pick.posted_at).getTime();
    return !isNaN(pickTime) && pickTime >= cutoffTime;
  });
}

/**
 * Pure calculation function for track record metrics.
 */
export function calculateRecordStats(picks: RecordPick[]): RecordStats {
  const totalPicks = picks.length;
  const pendingPicks = picks.filter((p) => p.result === 'pending');
  const settledPicks = picks.filter((p) => p.result === 'won' || p.result === 'lost');

  const wonCount = settledPicks.filter((p) => p.result === 'won').length;
  const lostCount = settledPicks.filter((p) => p.result === 'lost').length;
  const pendingCount = pendingPicks.length;

  const recordFormatted = `${wonCount}–${lostCount}`;

  // 1. Beat closing line
  const settledWithClosing = settledPicks.filter(
    (p) => typeof p.closing_odds === 'number' && p.closing_odds > 0
  );
  const beatClosingCount = settledWithClosing.filter(
    (p) => p.posted_odds > (p.closing_odds as number)
  ).length;

  const beatClosingPct =
    settledWithClosing.length > 0
      ? (beatClosingCount / settledWithClosing.length) * 100
      : 0;

  const beatClosingFormatted = `${beatClosingPct.toFixed(1)}%`;

  // 2. Hit rate vs Average Model Probability
  const hitRatePct =
    settledPicks.length > 0 ? (wonCount / settledPicks.length) * 100 : 0;
  const hitRateFormatted = `${hitRatePct.toFixed(1)}%`;

  const avgModelProb =
    settledPicks.length > 0
      ? settledPicks.reduce((acc, p) => acc + (p.model_probability || 0), 0) /
        settledPicks.length
      : 0;
  const avgModelProbPct = avgModelProb * 100;
  const avgModelProbFormatted = `${avgModelProbPct.toFixed(1)}%`;

  // 3. Return per pick (flat 1.0 unit stake at posted odds)
  // For each won pick: profit = +(posted_odds - 1)
  // For each lost pick: profit = -1.0
  let totalUnitsPnl = 0;
  for (const pick of settledPicks) {
    if (pick.result === 'won') {
      totalUnitsPnl += pick.posted_odds - 1;
    } else if (pick.result === 'lost') {
      totalUnitsPnl -= 1;
    }
  }

  const returnPerPickUnits =
    settledPicks.length > 0 ? totalUnitsPnl / settledPicks.length : 0;

  const returnPerPickFormatted = `${returnPerPickUnits >= 0 ? '+' : ''}${returnPerPickUnits.toFixed(2)}u`;

  const roiPct = returnPerPickUnits * 100;
  const roiFormatted = `${roiPct >= 0 ? '+' : ''}${roiPct.toFixed(1)}%`;

  return {
    totalPicks,
    settledPicks: settledPicks.length,
    wonCount,
    lostCount,
    pendingCount,
    recordFormatted,
    beatClosingCount,
    settledWithClosingCount: settledWithClosing.length,
    beatClosingPct,
    beatClosingFormatted,
    hitRatePct,
    hitRateFormatted,
    avgModelProbPct,
    avgModelProbFormatted,
    totalUnitsPnl,
    returnPerPickUnits,
    returnPerPickFormatted,
    roiPct,
    roiFormatted,
  };
}
