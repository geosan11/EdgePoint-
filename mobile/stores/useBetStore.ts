import { create } from 'zustand';
import { MarketType, ParlayLeg, Prediction, Sport } from '../lib/types';

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
  removeLegFromSlip: (predictionId: string) => void;
  clearSlip: () => void;
  isLegInSlip: (predictionId: string) => boolean;

  // Bankroll & User Settings
  bankroll: number;
  unitSize: number;
  setBankroll: (amount: number) => void;
  setUnitSize: (amount: number) => void;

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

    const propTitle = `${pred.player_name ? pred.player_name + ' ' : ''}${pred.selection} ${pred.line || ''}`.trim();
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
  setBankroll: (bankroll) => set({ bankroll }),
  setUnitSize: (unitSize) => set({ unitSize }),

  isPro: false, // Default: free teaser mode
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
      // Estimate individual model prob from EV
      const estProb = 1.0 / leg.odds + 0.05;
      jointProb *= Math.min(0.9, estProb);
    }

    // Apply 10% correlation bonus for cross-league synergy
    const correlationMultiplier = slipLegs.length > 1 ? 1.10 : 1.0;
    jointProb = Math.min(0.95, jointProb * correlationMultiplier);

    const jointEv = Math.round((jointProb * totalOdds - 1.0) * 1000) / 10;
    // Only recommend a stake when there's an actual edge -- flooring a
    // zero/negative-EV combo to 0.5u would misrepresent it as a real pick.
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
