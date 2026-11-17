import type { MatchFixture, Prediction } from './types';

/**
 * Extracts and normalizes win probability from various model fields.
 * Handles `modelProb`, `model_probability`, and `model_win_probability`.
 * Returns a decimal between 0 and 1.
 */
export function winProb(item: any): number {
  if (!item || typeof item !== 'object') {
    if (typeof item === 'number' && !Number.isNaN(item)) {
      return item > 1 ? item / 100 : Math.max(0, item);
    }
    return 0;
  }

  const raw =
    item.modelProb ??
    item.model_probability ??
    item.model_win_probability ??
    item.modelEdge?.modelProb;

  if (typeof raw !== 'number' || Number.isNaN(raw)) {
    return 0;
  }

  // If passed as a percentage like 61.2 or 58, normalize to 0.612 or 0.58
  if (raw > 1) {
    return Math.min(1, raw / 100);
  }

  return Math.max(0, raw);
}

/**
 * Computes fair odds as 1 / probability.
 * Returns decimal odds rounded to 2 decimal places, or 0 if invalid.
 */
export function fairOdds(probOrItem: number | any): number {
  const p = typeof probOrItem === 'number' ? (probOrItem > 1 ? probOrItem / 100 : probOrItem) : winProb(probOrItem);
  if (!p || p <= 0 || p > 1 || Number.isNaN(p)) {
    return 0;
  }
  return Number((1 / p).toFixed(2));
}

/**
 * Formats a Date into YYYY-MM-DD in the Africa/Lagos (WAT, UTC+1) timezone.
 */
export function getLagosDateString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    // Fallback if Intl timeZone is not supported: WAT is UTC+1
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const wat = new Date(utc + 3600000);
    return wat.toISOString().split('T')[0];
  }
}

/**
 * Checks if a commence_time string corresponds to "today" in Africa/Lagos time.
 */
export function isTodayInLagos(commenceTime?: string, refDate: Date = new Date()): boolean {
  if (!commenceTime || typeof commenceTime !== 'string') {
    return false;
  }

  const lower = commenceTime.toLowerCase();
  if (lower.includes('today') || lower.includes('tonight')) {
    return true;
  }
  if (lower.includes('tomorrow') || lower.includes('yesterday')) {
    return false;
  }

  // Attempt to parse standard date/ISO format
  const parsed = Date.parse(commenceTime);
  if (!Number.isNaN(parsed)) {
    const targetDate = new Date(parsed);
    return getLagosDateString(targetDate) === getLagosDateString(refDate);
  }

  // Default to true if unable to definitively determine to avoid dropping fixtures
  return true;
}

/**
 * Parse informal or ISO kickoff string into numeric score for sorting.
 */
function parseKickoffScore(str?: string): number {
  if (!str) return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(str);
  if (!Number.isNaN(parsed)) return parsed;

  const lower = str.toLowerCase();
  let dayOffset = 0;
  if (lower.includes('yesterday')) dayOffset = -86400000;
  else if (lower.includes('tomorrow')) dayOffset = 86400000;

  const timeMatch = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return dayOffset + (hours * 3600000 + minutes * 60000);
  }

  return dayOffset;
}

/**
 * Compare two kickoff strings for chronological ordering.
 */
export function compareKickoffs(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const scoreA = parseKickoffScore(a);
  const scoreB = parseKickoffScore(b);

  if (scoreA !== scoreB) {
    return scoreA - scoreB;
  }

  return a.localeCompare(b);
}

export interface BestPickResult {
  pick: Prediction;
  fixture?: MatchFixture;
}

/**
 * Selects the "Best Analysis Pick of the Day":
 * - Highest edge_score
 * - Filtered for "today" in Africa/Lagos
 * - Tie-break by kickoff, then by id
 * - Pairs with matching MatchFixture if available
 */
export function bestPick(
  predictions: Prediction[],
  fixtures: MatchFixture[] = [],
  refDate: Date = new Date()
): BestPickResult | null {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  // Filter for today in Lagos
  let candidates = predictions.filter((p) => isTodayInLagos(p.commence_time, refDate));

  // If no picks specifically match "today", fall back to all available predictions
  if (candidates.length === 0) {
    candidates = [...predictions];
  }

  // Sort: 1) edge_score DESC, 2) kickoff ASC, 3) id ASC
  const sorted = [...candidates].sort((a, b) => {
    const scoreA = typeof a.edge_score === 'number' && !Number.isNaN(a.edge_score) ? a.edge_score : 0;
    const scoreB = typeof b.edge_score === 'number' && !Number.isNaN(b.edge_score) ? b.edge_score : 0;

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const kickoffDiff = compareKickoffs(a.commence_time, b.commence_time);
    if (kickoffDiff !== 0) {
      return kickoffDiff;
    }

    return a.id.localeCompare(b.id);
  });

  const winner = sorted[0];
  if (!winner) return null;

  const fixture = fixtures.find((f) => f.id === winner.fixture_id);
  return { pick: winner, fixture };
}

/**
 * Returns top 3-5 edges after the hero (excluding the best pick).
 */
export function todaysPicks(
  predictions: Prediction[],
  bestPickId?: string,
  limit: number = 4,
  refDate: Date = new Date()
): Prediction[] {
  if (!predictions || predictions.length === 0) {
    return [];
  }

  // Prefer today's picks, exclude bestPickId
  let candidates = predictions.filter(
    (p) => (!bestPickId || p.id !== bestPickId) && isTodayInLagos(p.commence_time, refDate)
  );

  if (candidates.length === 0) {
    candidates = predictions.filter((p) => !bestPickId || p.id !== bestPickId);
  }

  return [...candidates]
    .sort((a, b) => {
      const scoreA = typeof a.edge_score === 'number' ? a.edge_score : 0;
      const scoreB = typeof b.edge_score === 'number' ? b.edge_score : 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const kickoffDiff = compareKickoffs(a.commence_time, b.commence_time);
      if (kickoffDiff !== 0) return kickoffDiff;
      return a.id.localeCompare(b.id);
    })
    .slice(0, limit);
}

/**
 * Selects featured matches for the horizontal carousel:
 * Next ~6 fixtures by kickoff with live matches first.
 */
export function featured(fixtures: MatchFixture[], limit: number = 6): MatchFixture[] {
  if (!fixtures || fixtures.length === 0) {
    return [];
  }

  return [...fixtures]
    .sort((a, b) => {
      // Live matches come first
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;

      // Then sort by commenceTime
      return compareKickoffs(a.commenceTime, b.commenceTime);
    })
    .slice(0, limit);
}

/**
 * Extracts SportyBet odds for a given fixture, market key, and selection side.
 * Never returns another book's odds.
 */
export function getSportyBetOdds(
  fixture?: MatchFixture,
  marketKey?: 'moneyline' | 'spread' | 'total',
  side?: 'home' | 'away' | 'over' | 'under' | 'draw'
): number | null {
  if (!fixture?.bookOdds?.sportybet) {
    return null;
  }

  const sporty = fixture.bookOdds.sportybet;

  if (marketKey === 'moneyline' && sporty.moneyline && side) {
    if (side === 'home') return sporty.moneyline.home ?? null;
    if (side === 'away') return sporty.moneyline.away ?? null;
    if (side === 'draw') return sporty.moneyline.draw ?? null;
  }

  if (marketKey === 'spread' && sporty.spread && side) {
    if (side === 'home') return sporty.spread.homeOdds ?? null;
    if (side === 'away') return sporty.spread.awayOdds ?? null;
  }

  if (marketKey === 'total' && sporty.total && side) {
    if (side === 'over') return sporty.total.overOdds ?? null;
    if (side === 'under') return sporty.total.underOdds ?? null;
  }

  // Fallback: check any available sportybet odds in order
  if (sporty.total?.overOdds) return sporty.total.overOdds;
  if (sporty.moneyline?.home) return sporty.moneyline.home;

  return null;
}

/**
 * Generates key insight text:
 * Reuses summary_analysis if provided, else builds a deterministic template
 * using ONLY real numbers (model probability, SportyBet odds, edge percentage).
 * No invented narrative or claims.
 */
export function generateKeyInsight(params: {
  summary?: string;
  pickName?: string;
  modelProb: number;
  sportyOdds?: number | null;
  edgePct?: number;
}): string {
  if (params.summary && params.summary.trim().length > 0) {
    return params.summary.trim();
  }

  const probPct = Math.round(params.modelProb * 100);
  const edgeStr = params.edgePct !== undefined ? `+${params.edgePct.toFixed(1)}%` : 'positive';

  if (params.sportyOdds && params.sportyOdds > 1) {
    const impliedPct = Math.round((1 / params.sportyOdds) * 100);
    return `Model gives ${probPct}% vs SportyBet implied ${impliedPct}% — a ${edgeStr} edge.`;
  }

  return `Model projects ${probPct}% win probability with a ${edgeStr} edge.`;
}

/**
 * Deterministic monogram creator for team crests.
 * Generates 2-3 letter initials and distinct palette colors.
 */
export function getTeamMonogram(teamName: string): { initials: string; bgColor: string; textColor: string } {
  if (!teamName) {
    return { initials: 'EP', bgColor: '#0F172A', textColor: '#FFFFFF' };
  }

  // Pre-configured major teams for clean brand presentation
  const knownTeams: Record<string, { initials: string; bg: string; text: string }> = {
    'Golden State Warriors': { initials: 'GSW', bg: '#1D428A', text: '#FFC72C' },
    'Los Angeles Lakers': { initials: 'LAL', bg: '#552583', text: '#FDB927' },
    'Arsenal': { initials: 'ARS', bg: '#EF0107', text: '#FFFFFF' },
    'Chelsea': { initials: 'CHE', bg: '#034694', text: '#FFFFFF' },
    'New York Knicks': { initials: 'NYK', bg: '#006BB6', text: '#F58426' },
    'Boston Celtics': { initials: 'BOS', bg: '#007A33', text: '#FFFFFF' },
    'Manchester City': { initials: 'MCI', bg: '#6CABDD', text: '#1C2C5B' },
    'Liverpool': { initials: 'LIV', bg: '#C8102E', text: '#FFFFFF' },
    'Oklahoma City Thunder': { initials: 'OKC', bg: '#007AC1', text: '#EF3B24' },
    'Denver Nuggets': { initials: 'DEN', bg: '#0E2240', text: '#FEC524' },
  };

  if (knownTeams[teamName]) {
    const { initials, bg, text } = knownTeams[teamName];
    return { initials, bgColor: bg, textColor: text };
  }

  // Derive initials from words
  const words = teamName.trim().split(/\s+/);
  let initials = '';
  if (words.length === 1) {
    initials = words[0].slice(0, 3).toUpperCase();
  } else if (words.length === 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else {
    initials = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }

  // Deterministic palette
  const palette = [
    { bg: '#0284C7', text: '#FFFFFF' },
    { bg: '#059669', text: '#FFFFFF' },
    { bg: '#7C3AED', text: '#FFFFFF' },
    { bg: '#D97706', text: '#FFFFFF' },
    { bg: '#DC2626', text: '#FFFFFF' },
    { bg: '#0F172A', text: '#FFFFFF' },
    { bg: '#475569', text: '#FFFFFF' },
  ];

  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash << 5) - hash + teamName.charCodeAt(i);
    hash |= 0;
  }
  const color = palette[Math.abs(hash) % palette.length];

  return { initials, bgColor: color.bg, textColor: color.text };
}
