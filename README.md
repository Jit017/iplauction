# IPL Auction Simulator

TypeScript-based IPL Auction Simulator with AI bidding, state machine, and player data conversion.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Convert CSV to players:
```bash
npm run convert
```

Or using ts-node directly:
```bash
npx ts-node convert-csv-to-players.ts
```

This will generate `players.ts` with all auction-ready players from `cricket_data_2025.csv`.

## Project Structure

- `types.ts` - TypeScript interfaces and enums
- `retention.ts` - IPL retention validation
- `auction-price-validator.ts` - Price validation utilities
- `ai-bidding.ts` - AI bidding logic for teams
- `auction-engine.ts` - Auction state machine engine
- `convert-csv-to-players.ts` - CSV to Player conversion script
- `cricket_data_2025.csv` - Source player data
- `players.ts` - Generated player data (after conversion)

## Usage

```typescript
import { AuctionEngine } from './auction-engine';
import { players } from './players';

const teams = [/* your teams */];
const engine = new AuctionEngine(teams);

engine.subscribe((event) => {
  console.log('Event:', event.type, event.state);
});

engine.setCurrentPlayer(players[0]);
engine.acceptBid(teams[0]);
```

