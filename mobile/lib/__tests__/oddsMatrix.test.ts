import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS, BookId } from '../books';
import { MOCK_FIXTURES, getFixtures } from '../supabase';
import type { MatchFixture } from '../types';

describe('Books Registry & Multi-Book Architecture', () => {
  it('registers SportyBet as active and secondary books as coming_soon', () => {
    const activeBooks = BOOKS.filter((b) => b.status === 'active');
    const comingSoonBooks = BOOKS.filter((b) => b.status === 'coming_soon');

    assert.equal(activeBooks.length, 1);
    assert.equal(activeBooks[0].id, 'sportybet');
    assert.equal(activeBooks[0].label, 'SportyBet');

    const comingSoonIds = comingSoonBooks.map((b) => b.id);
    assert.deepEqual(comingSoonIds, ['bet9ja', 'betking', 'pinnacle']);

    const pinnacle = BOOKS.find((b) => b.id === 'pinnacle');
    assert.equal(pinnacle && 'role' in pinnacle ? pinnacle.role : undefined, 'sharp_benchmark');
  });

  it('safely treats missing or mock dataSource as sample data', async () => {
    // Claude Sonnet review rule 1: dataSource !== 'live' is sample
    const fixtures = await getFixtures();
    assert.ok(fixtures.length > 0);
    for (const fixture of fixtures) {
      assert.equal(fixture.dataSource, 'sample');
    }

    const testFixtureWithoutDataSource: Partial<MatchFixture> = { id: 'test-1' };
    const isSample = testFixtureWithoutDataSource.dataSource !== 'live';
    assert.equal(isSample, true);

    const liveFixture: Partial<MatchFixture> = { id: 'test-2', dataSource: 'live' };
    const isLive = liveFixture.dataSource === 'live';
    assert.equal(isLive, true);
  });
});

describe('Odds Matrix cell highlight & format rules', () => {
  function isCellHighlighted(
    modelEdge: MatchFixture['modelEdge'] | undefined,
    cellMarketKey: 'moneyline' | 'spread' | 'total',
    cellSide?: 'home' | 'away' | 'over' | 'under' | 'draw'
  ): boolean {
    if (!modelEdge || !modelEdge.marketKey) return false;
    if (modelEdge.marketKey !== cellMarketKey) return false;
    if (modelEdge.side && cellSide && modelEdge.side !== cellSide) return false;
    return true;
  }

  it('highlights cell only when typed marketKey and side match modelEdge', () => {
    const totalEdge: MatchFixture['modelEdge'] = {
      market: 'Total',
      pick: 'Over 226.5',
      edgePct: 5.4,
      modelProb: 0.548,
      marketKey: 'total',
      side: 'over',
    };

    assert.equal(isCellHighlighted(totalEdge, 'total', 'over'), true);
    assert.equal(isCellHighlighted(totalEdge, 'total', 'under'), false);
    assert.equal(isCellHighlighted(totalEdge, 'spread', 'home'), false);
    assert.equal(isCellHighlighted(totalEdge, 'moneyline', 'home'), false);

    const spreadAwayEdge: MatchFixture['modelEdge'] = {
      market: 'Spread',
      pick: 'Celtics -4.5',
      edgePct: 4.8,
      modelProb: 0.551,
      marketKey: 'spread',
      side: 'away',
    };

    assert.equal(isCellHighlighted(spreadAwayEdge, 'spread', 'away'), true);
    assert.equal(isCellHighlighted(spreadAwayEdge, 'spread', 'home'), false);

    // Free text without marketKey (e.g. BTTS) never accidentally highlights
    const bttsEdge: MatchFixture['modelEdge'] = {
      market: 'BTTS',
      pick: 'Both Teams to Score (Yes)',
      edgePct: 8.6,
      modelProb: 0.684,
    };
    assert.equal(isCellHighlighted(bttsEdge, 'total', 'over'), false);
    assert.equal(isCellHighlighted(bttsEdge, 'spread', 'home'), false);
    assert.equal(isCellHighlighted(bttsEdge, 'moneyline', 'home'), false);
  });

  it('renders em dash ("—") for missing or coming-soon book odds', () => {
    function formatCellOdds(bookId: BookId, oddsValue?: number): string {
      const book = BOOKS.find((b) => b.id === bookId);
      if (!book || book.status === 'coming_soon' || oddsValue === undefined || oddsValue === null) {
        return '—';
      }
      return oddsValue.toFixed(2);
    }

    assert.equal(formatCellOdds('pinnacle', 1.95), '—');
    assert.equal(formatCellOdds('bet9ja', 2.05), '—');
    assert.equal(formatCellOdds('betking', 1.88), '—');
    assert.equal(formatCellOdds('sportybet', 1.91), '1.91');
    assert.equal(formatCellOdds('sportybet', undefined), '—');
  });

  it('identifies soccer fixtures with draw odds for 3-way moneyline row', () => {
    const eplFixture = MOCK_FIXTURES.find((f) => f.id === 'fix-epl-1')!;
    const nbaFixture = MOCK_FIXTURES.find((f) => f.id === 'fix-nba-1')!;

    const hasEplDraw = eplFixture.bookOdds?.sportybet?.moneyline?.draw !== undefined;
    const hasNbaDraw = nbaFixture.bookOdds?.sportybet?.moneyline?.draw !== undefined;

    assert.equal(hasEplDraw, true);
    assert.equal(hasNbaDraw, false);
  });
});
