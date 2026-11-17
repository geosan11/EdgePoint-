import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  winProb,
  fairOdds,
  isTodayInLagos,
  getLagosDateString,
  bestPick,
  todaysPicks,
  featured,
  getSportyBetOdds,
  generateKeyInsight,
  getTeamMonogram,
} from '../homeSelectors';
import type { MatchFixture, Prediction } from '../types';

describe('Home Selectors - Win Probability & Fair Odds', () => {
  it('correctly adapts modelProb, model_probability, and percentages', () => {
    // Decimal modelProb
    assert.equal(winProb({ modelProb: 0.612 }), 0.612);

    // Decimal model_probability
    assert.equal(winProb({ model_probability: 0.58 }), 0.58);

    // Nested fixture modelEdge
    assert.equal(winProb({ modelEdge: { modelProb: 0.548 } }), 0.548);

    // Percentage input (> 1)
    assert.equal(winProb({ modelProb: 65 }), 0.65);

    // Raw number input
    assert.equal(winProb(0.72), 0.72);
    assert.equal(winProb(72), 0.72);

    // Missing or invalid
    assert.equal(winProb(null), 0);
    assert.equal(winProb({}), 0);
    assert.equal(winProb('invalid'), 0);
  });

  it('computes fair odds as 1 / probability', () => {
    // 50% -> 2.00
    assert.equal(fairOdds(0.5), 2.0);

    // 61.2% -> 1 / 0.612 = 1.63
    assert.equal(fairOdds(0.612), 1.63);

    // From object
    assert.equal(fairOdds({ model_probability: 0.58 }), 1.72);

    // Zero or invalid probability
    assert.equal(fairOdds(0), 0);
    assert.equal(fairOdds(-0.5), 0);
    assert.equal(fairOdds(null), 0);
  });
});

describe('Home Selectors - Lagos Time & Date filtering', () => {
  it('identifies Today/Tonight as today in Lagos', () => {
    assert.equal(isTodayInLagos('Today, 12:30 PM ET'), true);
    assert.equal(isTodayInLagos('Tonight, 7:30 PM ET'), true);
    assert.equal(isTodayInLagos('Tomorrow, 11:30 AM ET'), false);
    assert.equal(isTodayInLagos('Yesterday, 9:00 PM ET'), false);
  });

  it('matches ISO timestamps against Africa/Lagos date', () => {
    // Reference date: 2026-11-17 12:00:00 UTC
    const ref = new Date('2026-11-17T12:00:00Z');
    const lagosToday = getLagosDateString(ref);
    assert.equal(lagosToday, '2026-11-17');

    // Fixture kickoff on the same day in Lagos
    assert.equal(isTodayInLagos('2026-11-17T19:30:00Z', ref), true);

    // Fixture kickoff on next day
    assert.equal(isTodayInLagos('2026-11-18T19:30:00Z', ref), false);
  });
});

describe('Home Selectors - Best Pick & Todays Picks', () => {
  const mockPredictions: Prediction[] = [
    {
      id: 'pred-1',
      fixture_id: 'fix-1',
      sport: 'basketball',
      league_id: 'nba',
      market_type: 'player_points',
      match_title: 'Warriors @ Lakers',
      selection: 'Over',
      best_bookmaker: 'SportyBet',
      sportsbook_odds: 1.95,
      implied_probability: 0.51,
      fair_odds: 1.72,
      model_probability: 0.58,
      ev_percentage: 13.1,
      edge_score: 86.5,
      recommended_units: 1.5,
      tier: 'free',
      status: 'pending',
      commence_time: 'Tonight, 10:30 PM ET',
    },
    {
      id: 'pred-2',
      fixture_id: 'fix-2',
      sport: 'football',
      league_id: 'epl',
      market_type: 'match_total',
      match_title: 'Arsenal vs Chelsea',
      selection: 'Over',
      best_bookmaker: 'SportyBet',
      sportsbook_odds: 1.91,
      implied_probability: 0.52,
      fair_odds: 1.64,
      model_probability: 0.61,
      ev_percentage: 16.5,
      edge_score: 89.0,
      recommended_units: 1.75,
      tier: 'free',
      status: 'pending',
      commence_time: 'Today, 12:30 PM ET',
    },
    {
      id: 'pred-3',
      fixture_id: 'fix-3',
      sport: 'basketball',
      league_id: 'nba',
      market_type: 'spread',
      match_title: 'Celtics @ Knicks',
      selection: 'Away',
      best_bookmaker: 'SportyBet',
      sportsbook_odds: 1.91,
      implied_probability: 0.52,
      fair_odds: 1.81,
      model_probability: 0.55,
      ev_percentage: 9.8,
      edge_score: 82.0,
      recommended_units: 1.0,
      tier: 'free',
      status: 'pending',
      commence_time: 'Tonight, 7:30 PM ET',
    },
    {
      id: 'pred-4-tomorrow',
      fixture_id: 'fix-4',
      sport: 'football',
      league_id: 'epl',
      market_type: 'btts',
      match_title: 'Man City vs Liverpool',
      selection: 'Yes',
      best_bookmaker: 'SportyBet',
      sportsbook_odds: 1.75,
      implied_probability: 0.57,
      fair_odds: 1.49,
      model_probability: 0.671,
      ev_percentage: 17.0,
      edge_score: 95.0, // Higher score, but tomorrow!
      recommended_units: 2.0,
      tier: 'free',
      status: 'pending',
      commence_time: 'Tomorrow, 11:30 AM ET',
    },
  ];

  const mockFixtures: MatchFixture[] = [
    {
      id: 'fix-2',
      sport: 'football',
      league: 'Premier League',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      status: 'upcoming',
      commenceTime: 'Today, 12:30 PM ET',
      markets: {},
    },
  ];

  it('selects highest edge_score for today (Arsenal pred-2 @ 89.0 over pred-4 @ 95.0 tomorrow)', () => {
    const result = bestPick(mockPredictions, mockFixtures);
    assert.ok(result);
    assert.equal(result.pick.id, 'pred-2');
    assert.equal(result.pick.edge_score, 89.0);
    assert.equal(result.fixture?.id, 'fix-2');
  });

  it('tie-breaks by kickoff then by id when scores are equal', () => {
    const tiePredictions: Prediction[] = [
      {
        ...mockPredictions[0],
        id: 'pred-b',
        edge_score: 90.0,
        commence_time: 'Tonight, 10:00 PM ET',
      },
      {
        ...mockPredictions[1],
        id: 'pred-a',
        edge_score: 90.0,
        commence_time: 'Tonight, 7:00 PM ET', // Earlier kickoff
      },
    ];

    const result = bestPick(tiePredictions);
    assert.ok(result);
    assert.equal(result.pick.id, 'pred-a');
  });

  it('todaysPicks returns secondary picks excluding the hero pick', () => {
    const secondary = todaysPicks(mockPredictions, 'pred-2', 3);
    assert.equal(secondary.length, 2);
    assert.ok(!secondary.some((p) => p.id === 'pred-2'));
    assert.equal(secondary[0].id, 'pred-1'); // 86.5
    assert.equal(secondary[1].id, 'pred-3'); // 82.0
  });
});

describe('Home Selectors - Featured Carousel & SportyBet Odds', () => {
  const fixtures: MatchFixture[] = [
    {
      id: 'fix-upcoming-1',
      sport: 'football',
      league: 'Premier League',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      status: 'upcoming',
      commenceTime: 'Tonight, 8:00 PM',
      markets: {},
    },
    {
      id: 'fix-live-1',
      sport: 'basketball',
      league: 'NBA',
      homeTeam: 'Team C',
      awayTeam: 'Team D',
      status: 'live',
      commenceTime: 'Tonight, 7:00 PM',
      markets: {},
      bookOdds: {
        sportybet: {
          total: { line: 220, overOdds: 1.95, underOdds: 1.88 },
          moneyline: { home: 1.8, away: 2.1 },
        },
      },
    },
  ];

  it('places live fixtures before upcoming fixtures in featured carousel', () => {
    const feat = featured(fixtures);
    assert.equal(feat.length, 2);
    assert.equal(feat[0].id, 'fix-live-1');
    assert.equal(feat[1].id, 'fix-upcoming-1');
  });

  it('extracts SportyBet odds and returns null for missing lines', () => {
    const odds = getSportyBetOdds(fixtures[1], 'total', 'over');
    assert.equal(odds, 1.95);

    const mlHome = getSportyBetOdds(fixtures[1], 'moneyline', 'home');
    assert.equal(mlHome, 1.8);

    const missing = getSportyBetOdds(fixtures[0], 'moneyline', 'home');
    assert.equal(missing, null);
  });

  it('generates honest key insights from numbers without fake narrative', () => {
    const insightWithSporty = generateKeyInsight({
      modelProb: 0.612,
      sportyOdds: 1.91,
      edgePct: 16.5,
    });
    assert.equal(
      insightWithSporty,
      'Model gives 61% vs SportyBet implied 52% — a +16.5% edge.'
    );

    const insightWithoutSporty = generateKeyInsight({
      modelProb: 0.58,
      sportyOdds: null,
      edgePct: 13.1,
    });
    assert.equal(
      insightWithoutSporty,
      'Model projects 58% win probability with a +13.1% edge.'
    );
  });

  it('generates team monogram crests deterministically', () => {
    const lakers = getTeamMonogram('Los Angeles Lakers');
    assert.equal(lakers.initials, 'LAL');
    assert.equal(lakers.bgColor, '#552583');

    const arsenal = getTeamMonogram('Arsenal');
    assert.equal(arsenal.initials, 'ARS');

    const generic = getTeamMonogram('Napoli');
    assert.ok(generic.initials.length >= 2);
    assert.ok(generic.bgColor.startsWith('#'));
  });
});
