# EdgePoint+ Mobile App (React Native / Expo + TypeScript)

Cross-platform iOS & Android mobile application for **EdgePoint+** (+EV Sports Betting Analytics & Correlated Parlays).

## Design System & Theme
- **Canvas / Background**: `#090A0F` (Pitch Obsidian)
- **Cards / Surface**: `#121620` (Dark Charcoal) with `#1E2536` borders
- **Primary Accent**: `#00E676` (Electric Green for +EV flags, EdgeScores, and purchase actions)
- **Secondary Accent**: `#00E5FF` (Laser Cyan for line metrics and steam alerts)
- **Warning / Solid Value**: `#FFB300` (Warm Amber for borderline edges)

---

## App Screens & Features

### 1. +EV Feed (`app/(tabs)/index.tsx`)
- Multi-sport switcher: **All Slates**, **Basketball 🏀** (NBA, CBA, EuroLeague), **Football ⚽** (EPL, UCL).
- Market filters: Points, Assists, PRA Combos, Match Totals, and Both Teams to Score (BTTS).
- Interactive pick cards with:
  - **EdgeScore (0–100)** badge
  - **EdgeDelta ($\Delta$)** margin discrepancy
  - **Best Sportsbook Odds** vs **Fair Model Odds**
  - **Fractional Kelly** recommended unit stake
  - Gated Pro overlay for non-paying users
  - Instant "+ Add to Slip" button

### 2. PointBlank Parlay Builder (`app/(tabs)/parlay.tsx`)
- **The Daily Slip**: Algorithmically curated cross-league anchor parlay with staggered start times and correlation boosts.
- **Custom Parlay Builder**:
  - Live calculations of combined decimal odds, model win probability, and joint EV%.
  - Bankroll stake & return calculator in Nigerian Naira (₦).

### 3. EdgeRadar Steam Tracker (`app/(tabs)/radar.tsx`)
- Real-time stream of sharp book (Pinnacle) steam line shifts.
- Reverse Line Movement (RLM) signals.
- Retail bookmaker divergence percentage indicators.

### 4. EdgePoint+ Paywall & Profile (`app/(tabs)/profile.tsx`)
- Subscription status management linked to **RevenueCat** and Supabase.
- Bankroll and 1.0 unit size configurator.
- Developer sandbox toggle to simulate Pro entitlement instantly.
- Google & Apple authentication triggers.

---

## Getting Started

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Run the App
```bash
# Start Expo development server
npx expo start

# Open on iOS simulator (Mac)
npx expo start --ios

# Open on Android emulator
npx expo start --android

# Open in Web Browser
npx expo start --web
```

### 3. Environment Variables (Optional)
Create `.env` inside `mobile/`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_your_apple_api_key
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_your_google_api_key
```
*(Note: EdgePoint+ comes preconfigured with high-fidelity realistic offline mock datasets, so the app runs smoothly out of the box even before setting up API keys!)*
