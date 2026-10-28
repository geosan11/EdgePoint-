import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRecordStats, filterPicksByPeriod } from '../record';
import type { RecordPick } from '../types';

const mockPicks: RecordPick[] = [
  {
    id: 'p1',
    selection: 'Lakers -3.5',
    market: 'Spread',
    league: 'NBA',
    posted_at: '2026-10-25T18:00:00Z',
    posted_odds: 1.95,
    closing_odds: 1.85, // beat closing (1.95 > 1.85)
    model_probability: 0.58,
    result: 'won',
  },
  {
    id: 'p2',
    selection: 'Arsenal ML',
    market: 'Moneyline',
    league: 'Premier League',
    posted_at: '2026-10-24T14:00:00Z',
    posted_odds: 2.10,
    closing_odds: 1.90, // beat closing (2.10 > 1.90)
    model_probability: 0.52,
    result: 'lost',
  },
  {
    id: 'p3',
    selection: 'Stephen Curry Over 26.5 PTS',
    market: 'Points',
    league: 'NBA',
    posted_at: '2026-10-20T20:00:00Z',
    posted_odds: 1.91,
    closing_odds: 1.95, // did NOT beat closing (1.91 < 1.95)
    model_probability: 0.57,
    result: 'won',
  },
  {
    id: 'p4',
    selection: 'Man City -1.5',
    market: 'Spread',
    league: 'Premier League',
    posted_at: '2026-10-28T19:00:00Z',
    posted_odds: 1.87,
    closing_odds: 1.82,
    model_probability: 0.59,
    result: 'pending',
  },
];

describe('calculateRecordStats', () => {
  it('correctly calculates record, hit rate, beat closing line, and return per pick', () => {
    const stats = calculateRecordStats(mockPicks);

    assert.equal(stats.totalPicks, 4);
    assert.equal(stats.settledPicks, 3);
    assert.equal(stats.wonCount, 2);
    assert.equal(stats.lostCount, 1);
    assert.equal(stats.pendingCount, 1);
    assert.equal(stats.recordFormatted, '2–1');

    // Settled with closing: 3. Beat closing (p1, p2): 2. 2/3 = 66.7%
    assert.equal(stats.beatClosingCount, 2);
    assert.equal(stats.settledWithClosingCount, 3);
    assert.equal(stats.beatClosingFormatted, '66.7%');

    // Hit rate: 2/3 = 66.7%
    assert.equal(stats.hitRateFormatted, '66.7%');

    // Avg model prob: (0.58 + 0.52 + 0.57) / 3 = 0.5567 -> 55.7%
    assert.equal(stats.avgModelProbFormatted, '55.7%');

    // Units PnL:
    // p1 (won @ 1.95) -> +0.95
    // p2 (lost @ 2.10) -> -1.0
    // p3 (won @ 1.91) -> +0.91
    // Total PnL = 0.95 - 1.0 + 0.91 = +0.86 units
    // Return per pick = 0.86 / 3 = +0.2866.. -> +0.29u
    assert.equal(stats.returnPerPickFormatted, '+0.29u');
    assert.equal(stats.roiFormatted, '+28.7%');
  });

  it('filters picks by period correctly', () => {
    const referenceDate = new Date('2026-10-28T12:00:00Z');
    const filtered30d = filterPicksByPeriod(mockPicks, '30d', referenceDate);
    assert.equal(filtered30d.length, 4); // all within 30 days

    const oldPick: RecordPick = {
      id: 'p_old',
      selection: 'Old Pick',
      market: 'Points',
      league: 'NBA',
      posted_at: '2026-08-01T12:00:00Z', // 88 days ago
      posted_odds: 1.91,
      model_probability: 0.55,
      result: 'won',
    };

    const combined = [...mockPicks, oldPick];
    const filteredOld30 = filterPicksByPeriod(combined, '30d', referenceDate);
    assert.equal(filteredOld30.length, 4);

    const filteredOld90 = filterPicksByPeriod(combined, '90d', referenceDate);
    assert.equal(filteredOld90.length, 5);

    const filteredAll = filterPicksByPeriod(combined, 'all', referenceDate);
    assert.equal(filteredAll.length, 5);
  });
});
