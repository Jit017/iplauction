# IPL Auction Simulator

A comprehensive TypeScript-based IPL (Indian Premier League) Auction Simulator featuring AI-powered bidding, real-time auction management, player retention, and a complete web interface.

## 🎯 Features

### Pre-Auction Setup
- **Auction Type Selection**: Choose between Mega Auction or Mini Auction
- **Team Selection**: Select your team from 10 IPL franchises
- **Previous Season Squad**: View and manage players from the previous season
- **Player Retention**: 
  - **Mega Auction**: Retain up to 6 players (max 4 capped, max 2 uncapped)
  - **Mini Auction**: Unlimited retentions allowed
- **Live Purse Deduction**: Real-time calculation of retention costs
- **Retention Cost Calculation**: 
  - Capped players: 18 Cr, 14 Cr, 8 Cr, or 4 Cr (based on retention slot)
  - Uncapped players: 4 Cr fixed
- **Validation**: Automatic validation of retention rules before proceeding

### Auction Engine
- **State Machine Architecture**: Robust event-driven auction state management
- **Timer-Based Bidding**: 30-second countdown timer for each player
- **IPL-Style Bid Increments**:
  - Below 5 Cr: 0.25 Cr increments
  - 5-10 Cr: 0.5 Cr increments
  - Above 10 Cr: 1 Cr increments
- **Price Validation**: 
  - Enforces `minPrice` and `maxPrice` constraints
  - Prevents forced sales below base price
- **UNSOLD Handling**: Players go unsold if no bids or below base price
- **Retained Player Exclusion**: Automatically skips retained players from auction pool
- **Event Subscription**: Subscribe to auction events for UI updates

### AI Bidding System
- **Rating Band-Based Bidding**:
  - **Elite (>90)**: Aggressive bidding, high probability
  - **Premium (80-90)**: Selective bidding, moderate probability
  - **Standard (70-80)**: Standard bidding, lower probability
  - **Conservative (<70)**: Conservative bidding, low probability
- **Team Aggression Levels**: Each team has an aggression rating (0-100) affecting bid probability
- **Star Player Detection**: Players with rating >85 get enhanced aggression boost
- **Role Needs Checking**: Teams bid based on squad composition requirements
- **Dynamic Dropout Logic**:
  - Teams drop out near `maxPrice` (within 5% or <2 Cr gap)
  - Low purse protection (stops if purse <10 Cr)
  - Insufficient funds check (stops if next bid leaves <5 Cr)
- **Real-Time Competitive Bidding**: AI teams bid automatically on each timer tick
- **Reactive Bidding**: AI teams respond to new bids within 300ms for competitive feel
- **Flexible Squad Building**: Teams continue bidding for upgrades/backups even after minimum requirements met

### Manual Bidding
- **User-Controlled Team**: Manual bidding restricted to your selected team
- **Bid Validation**: Automatic validation of bid amounts and team purse
- **Next Bid Calculation**: Automatic calculation of next valid bid amount
- **Timer Reset**: Manual bids reset the auction timer

### Player Management
- **CSV to Player Conversion**: Converts cricket statistics CSV to auction-ready players
- **Role Inference**: Automatically infers player roles (Batsman, Bowler, All-Rounder, Wicket-Keeper) from statistics
- **Rating Calculation**: 
  - Batting score (runs, average, strike rate)
  - Bowling score (wickets, economy, average)
  - Fielding score (catches, stumpings)
  - Normalized to 1-100 rating scale
- **Price Derivation**:
  - `basePrice`: 2 Cr for capped, 1 Cr for uncapped (IPL rules)
  - `minPrice` and `maxPrice`: Derived from rating for internal validation
- **Capped/Uncapped Status**: Determined from player statistics
- **Latest Year Selection**: Automatically selects most recent year's data per player

### Squad Validation
- **Maximum Squad Size**: 25 players per team
- **Overseas Player Limit**: Maximum 8 overseas players
- **Minimum Role Requirements**:
  - 6 Batsmen
  - 6 Bowlers
  - 2 All-Rounders
  - 1 Wicket-Keeper (Wicket-Keeper-Batsman counts towards this)
- **Real-Time Validation**: Validates squad composition during bidding

### Auction Logging
- **Detailed Event Logging**: Logs all auction events with timestamps
- **Player Information**: Name, role, rating, final price
- **Winning Team**: Team that won the player
- **Bid Statistics**: Number of bids, auction duration
- **Export Functionality**: Export logs as JSON or CSV
- **Summary Statistics**: Overall auction statistics and analysis

### User Interface
- **Pre-Auction Setup Screen**: Complete setup flow before auction starts
- **Real-Time Auction Display**: 
  - Current player card with role, base price, capped status
  - Current bid and leading team
  - Timer countdown
  - Team purse overview
- **Team Highlighting**: User's team highlighted with "Your Team" badge
- **AI Team Indicators**: "AI Controlled" badges for other teams
- **Manual Bid Controls**: Bid button for user's team
- **Auction Controls**: Start auction, next player buttons
- **Responsive Design**: Clean, modern UI with CSS styling

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jit017/iplauction.git
cd iplauction
```

2. Install dependencies:
```bash
npm install
```

3. Convert CSV data to players:
```bash
npm run convert
```

This will generate `players.ts` from `cricket_data_2025.csv`.

4. (Optional) Validate generated players:
```bash
npm run validate
```

### Running the Application

1. Build the UI:
```bash
npm run build:ui
```

2. Start the development server:
```bash
npm run serve
```

Or use the dev command for auto-reload:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:8080`.

## 📁 Project Structure

```
iplauction/
├── types.ts                      # TypeScript interfaces and enums
├── teams.ts                      # IPL teams data (10 teams)
├── players.ts                    # Generated player data (from CSV)
├── previous-season-squads.ts    # Previous season squad data
├── retention.ts                  # Retention validation logic
├── auction-engine.ts            # Core auction state machine
├── auction-manager.ts           # Auction orchestration
├── auction-pool.ts              # Auction pool management
├── auction-price-validator.ts  # Price validation utilities
├── auction-state.ts             # Global auction state management
├── ai-bidding.ts                # AI bidding logic
├── bid-utils.ts                 # IPL-style bid increment utilities
├── squad-validator.ts           # Squad validation rules
├── auction-logger.ts            # Auction event logging
├── setup.ts                     # Pre-auction setup logic
├── setup-ui.ts                  # Setup screen UI logic
├── ui.ts                        # Main auction UI logic
├── convert-csv-to-players.ts    # CSV to Player conversion script
├── validate-players.ts          # Player data validation script
├── index.html                   # Main HTML file
├── styles.css                   # UI styling
├── cricket_data_2025.csv        # Source player data
└── package.json                 # Project dependencies
```

## 🎮 Usage

### Pre-Auction Setup

1. **Select Auction Type**: Choose Mega Auction or Mini Auction
2. **Select Your Team**: Pick from 10 IPL teams
3. **View Previous Squad**: See players from last season
4. **Retain Players**: 
   - Select players to retain
   - Watch live purse deduction
   - Validate retention rules
5. **Proceed to Auction**: Click "Proceed to Auction" when ready

### During Auction

1. **Watch AI Bidding**: AI teams bid automatically and competitively
2. **Manual Bidding**: Click "Bid" button for your team when you want to bid
3. **Monitor Timer**: 30-second countdown for each player
4. **Track Purse**: Monitor remaining purse for all teams
5. **View Results**: See SOLD/UNSOLD status for each player

### Auction Flow

- Players are auctioned sequentially
- Retained players are automatically skipped
- Timer starts at 30 seconds
- Bids reset the timer
- Auction ends when timer reaches 0
- Player is marked SOLD or UNSOLD
- Automatically moves to next player

## 🔧 Configuration

### Team Configuration

Teams are configured in `teams.ts` with:
- `id`: Unique team identifier
- `name`: Team name
- `purse`: Starting purse (default: 100 Cr)
- `aggression`: Bidding aggression (0-100)
- `roleNeeds`: Minimum role requirements

### AI Bidding Configuration

AI bidding behavior can be configured in `ai-bidding.ts`:
- `minRatingThreshold`: Minimum player rating to bid (default: 50)
- `useRatingBands`: Enable rating band-based bidding (default: true)
- `baseBidProbability`: Base probability multiplier (default: 0.3)

### Auction Configuration

Auction settings in `auction-engine.ts`:
- `timerDuration`: Auction timer duration in seconds (default: 30)
- Bid increments follow IPL rules automatically

## 📊 Player Data

### Player Attributes

- `id`: Unique player identifier
- `name`: Player name
- `role`: Player role (BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER, WICKET_KEEPER_BATSMAN)
- `basePrice`: Base auction price (2 Cr capped, 1 Cr uncapped)
- `minPrice`: Minimum valid price (internal)
- `maxPrice`: Maximum valid price (internal)
- `rating`: Player rating (1-100)
- `popularity`: Popularity index (0-100)
- `isCapped`: Whether player has played for national team

### CSV Data Format

The CSV file should contain columns:
- Player name
- Year
- Batting statistics (runs, average, strike rate, etc.)
- Bowling statistics (wickets, economy, average, etc.)
- Fielding statistics (catches, stumpings)

See `cricket_data_2025.csv` for example format.

## 🧪 Scripts

- `npm run convert`: Convert CSV to players.ts
- `npm run validate`: Validate generated players
- `npm run build:ui`: Build UI bundle
- `npm run serve`: Build and serve application
- `npm run dev`: Build and serve with auto-reload

## 🎯 IPL Rules Implemented

### Retention Rules
- **Mega Auction**: Max 6 retentions (4 capped max, 2 uncapped max)
- **Mini Auction**: Unlimited retentions
- Retention costs based on player type and slot

### Bid Increments
- < 5 Cr: 0.25 Cr
- 5-10 Cr: 0.5 Cr
- > 10 Cr: 1 Cr

### Squad Rules
- Maximum 25 players
- Maximum 8 overseas players
- Minimum role requirements enforced

### Base Price Rules
- Capped players: 2 Cr
- Uncapped players: 1 Cr

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- IPL auction rules and regulations
- Cricket statistics data sources
- TypeScript and modern web technologies

## 📧 Contact

For questions or issues, please open an issue on GitHub.

---

**Enjoy simulating IPL auctions! 🏏**
