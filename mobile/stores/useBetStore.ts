import { create } from 'zustand';
import { MarketType, ParlayLeg, Prediction, Sport, TrackerBet } from '../lib/types';

interface BetStoreState {
  // Filters
  selectedSport: Sport | 'all';
  selectedMarket: MarketType | 'all';
  minEdgeScore: number;
  setSport: (sport: Sport | 'all') => void;
  setMarket: (market: MarketType | 'all') => void;
  setMinEdgeScore: (score: number) => void;

  // Slip Builder
  slipLegs: ParlayLeg[];
  addLegToSlip: (prediction: Prediction) => void;
  addCustomLeg: (leg: ParlayLeg) => void;
  removeLegFromSlip: (predictionId: string) => void;
  clearSlip: () => void;
  isLegInSlip: (predictionId: string) => boolean;

  // Tracker / Bankroll State
  bankroll: number;
  unitSize: number;
  currency: 'USD' | 'NGN';
  kellyFraction: number; // 0.25 (1/4 Kelly)
  trackerBets: TrackerBet[];
  setBankroll: (amount: number) => void;
  setUnitSize: (amount: number) => void;
  setCurrency: (c: 'USD' | 'NGN') => void;
  setKellyFraction: (f: number) => void;
  saveSlipToTracker: (stakeUnits: number) => void;

  // Subscription State
  isPro: boolean;
  setPro: (isPro: boolean) => void;
  toggleProMock: () => void;

  // Paywall Modal State
  isPaywallVisible: boolean;
  openPaywall: () => void;
  closePaywall: () => void;

  // Calculated Slip Metrics
  getSlipMetrics: () => {
    totalOdds: number;
    jointProb: number;
    jointEv: number;
    recommendedUnits: number;
  };
}

export const useBetStore = create<BetStoreState>((set, get) => ({
  selectedSport: 'all',
  selectedMarket: 'all',
  minEdgeScore: 0,
  setSport: (sport) => set({ selectedSport: sport }),
  setMarket: (market) => set({ selectedMarket: market }),
  setMinEdgeScore: (minEdgeScore) => set({ minEdgeScore }),

  slipLegs: [],
  addLegToSlip: (pred) => {
    const existing = get().slipLegs.find((leg) => leg.prediction_id === pred.id);
    if (existing) return;

    const propTitle = `${pred.player_name ? pred.player_name + ' ' : ''}${pred.selection} ${pred.line !== undefined ? pred.line : ''}`.trim();
    const newLeg: ParlayLeg = {
      prediction_id: pred.id,
      fixture: pred.match_title,
      prop: propTitle,
      selection: pred.selection,
      odds: pred.sportsbook_odds,
      ev: `+${pred.ev_percentage}% EV`,
      bookmaker: pred.best_bookmaker,
      edge_score: pred.edge_score,
    };

    set((state) => ({ slipLegs: [...state.slipLegs, newLeg] }));
  },
  addCustomLeg: (leg) => {
    const existing = get().slipLegs.find((l) => l.prediction_id === leg.prediction_id);
    if (existing) return;
    set((state) => ({ slipLegs: [...state.slipLegs, leg] }));
  },
  removeLegFromSlip: (predictionId) => {
    set((state) => ({
      slipLegs: state.slipLegs.filter((leg) => leg.prediction_id !== predictionId),
    }));
  },
  clearSlip: () => set({ slipLegs: [] }),
  isLegInSlip: (predictionId) => {
    return get().slipLegs.some((leg) => leg.prediction_id === predictionId);
  },

  bankroll: 100000, // ₦100,000 baseline
  unitSize: 1000,   // ₦1,000 / 1 unit
  currency: 'NGN',
  kellyFraction: 0.25,
  trackerBets: [
    {
      id: 'tb-1',
      date: 'Today, 14:30',
      fixture: 'Arsenal vs Chelsea',
      prop: 'Over 2.5 Goals',
      sport: 'football',
      odds: 1.91,
      stake: 1750,
      stakeUnits: 1.75,
      result: 'pending',
      pnl: 0,
      modelEdge: 16.5,
      closingLineValue: 4.8,
    },
    {
      id: 'tb-2',
      date: 'Yesterday',
      fixture: 'Celtics @ Knicks',
      prop: 'Jayson Tatum Over 27.5 Pts',
      sport: 'basketball',
      odds: 1.95,
      stake: 1500,
      stakeUnits: 1.5,
      result: 'won',
      pnl: 1425,
      modelEdge: 14.2,
      closingLineValue: 5.1,
    },
    {
      id: 'tb-3',
      date: 'Oct 25',
      fixture: 'Man City vs Liverpool',
      prop: 'Both Teams To Score (Yes)',
      sport: 'football',
      odds: 1.75,
      stake: 2000,
      stakeUnits: 2.0,
      result: 'won',
      pnl: 1500,
      modelEdge: 17.3,
      closingLineValue: 6.2,
    },
    {
      id: 'tb-4',
      date: 'Oct 24',
      fixture: 'Warriors @ Lakers',
      prop: 'Stephen Curry Over 4.5 Threes',
      sport: 'basketball',
      odds: 2.10,
      stake: 1000,
      stakeUnits: 1.0,
      result: 'lost',
      pnl: -1000,
      modelEdge: 11.0,
      closingLineValue: 1.5,
    },
  ],
  setBankroll: (bankroll) => set({ bankroll }),
  setUnitSize: (unitSize) => set({ unitSize }),
  setCurrency: (currency) => set({ currency }),
  setKellyFraction: (kellyFraction) => set({ kellyFraction }),
  saveSlipToTracker: (stakeUnits) => {
    const { slipLegs, unitSize, getSlipMetrics } = get();
    if (slipLegs.length === 0) return;
    const metrics = getSlipMetrics();
    const newBet: TrackerBet = {
      id: `tb-${Date.now()}`,
      date: 'Just now',
      fixture: slipLegs.length === 1 ? slipLegs[0].fixture : `Custom Parlay (${slipLegs.length} Legs)`,
      prop: slipLegs.map((l) => l.prop).join(' + '),
      sport: 'basketball',
      odds: metrics.totalOdds,
      stake: stakeUnits * unitSize,
      stakeUnits,
      result: 'pending',
      pnl: 0,
      modelEdge: metrics.jointEv,
    };
    set((state) => ({
      trackerBets: [newBet, ...state.trackerBets],
      slipLegs: [],
    }));
  },

  isPro: false,
  setPro: (isPro) => set({ isPro }),
  toggleProMock: () => set((state) => ({ isPro: !state.isPro })),

  isPaywallVisible: false,
  openPaywall: () => set({ isPaywallVisible: true }),
  closePaywall: () => set({ isPaywallVisible: false }),

  getSlipMetrics: () => {
    const { slipLegs } = get();
    if (slipLegs.length === 0) {
      return { totalOdds: 1.0, jointProb: 1.0, jointEv: 0, recommendedUnits: 0 };
    }

    let totalOdds = 1.0;
    let jointProb = 1.0;

    for (const leg of slipLegs) {
      totalOdds *= leg.odds;
      const estProb = 1.0 / leg.odds + 0.05;
      jointProb *= Math.min(0.9, estProb);
    }

    const correlationMultiplier = slipLegs.length > 1 ? 1.08 : 1.0;
    jointProb = Math.min(0.95, jointProb * correlationMultiplier);

    const jointEv = Math.round((jointProb * totalOdds - 1.0) * 1000) / 10;
    const recommendedUnits =
      jointEv > 0 ? Math.min(2.5, Math.max(0.5, Math.round((jointEv / 20) * 10) / 10)) : 0;

    return {
      totalOdds: Math.round(totalOdds * 100) / 100,
      jointProb: Math.round(jointProb * 1000) / 1000,
      jointEv,
      recommendedUnits,
    };
  },
}));
