# Auction UI Setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate players data:**
   ```bash
   npm run convert
   ```

3. **Serve the UI:**
   ```bash
   npm run serve
   ```
   
   Or use any static file server:
   ```bash
   npx http-server . -p 8080
   python -m http.server 8080
   ```

4. **Open in browser:**
   Navigate to `http://localhost:8080`

## Building for Production

If you want to compile TypeScript:

```bash
npm run build
```

Then serve the `dist` folder.

## Features

- **Current Player Card**: Shows player details (name, role, rating, prices)
- **Auction Status**: Displays current bid, leading team, timer, and status
- **Team Purse Overview**: Shows all teams with their purse, squad size, and stats
- **Controls**: Start auction, proceed to next player, pause/resume

## Customization

Edit `ui.ts` to:
- Modify sample teams in `initializeTeams()`
- Change UI behavior
- Add custom event handlers

