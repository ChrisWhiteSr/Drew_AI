# Steam Arbitrage - Quick Start Guide

## Running the HTML Prototype Locally

Your current app is a **static HTML/CSS/JavaScript prototype** with mock data. No installation or API keys required!

### Option 1: Python HTTP Server (Recommended for macOS)

```bash
# Navigate to your project directory
cd /Users/drewwhite/Code/Drew_AI

# Start the server
python3 -m http.server 8000
```

Then open your browser to: **http://localhost:8000**

Press `CTRL+C` to stop the server when done.

---

### Option 2: Node.js http-server

If you prefer Node.js:

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Start the server
http-server -p 8000

# Or use npx (no installation needed)
npx http-server -p 8000
```

Then open: **http://localhost:8000**

---

## What You'll See

1. **Landing Page**: Enter a Steam ID or profile URL
2. **Mock Analysis**: App simulates fetching inventory and comparing prices
3. **Results Table**: See profitable items across marketplaces
4. **TikTok Sharing**: Generate shareable profit screenshots

### Test Features:

- Enter any Steam ID (e.g., `76561198000000000`)
- Select CS2 or Dota 2
- Click "Analyze My Inventory"
- View mock results with profit calculations
- Test filters: All Items / Profitable Only / High Value
- Try the TikTok share modal

---

## Current Limitations (Mock Data Only)

❌ Not connected to real Steam API  
❌ Not fetching real marketplace prices  
❌ Not calculating actual profits  
✅ **BUT** demonstrates full user experience and UI design!

---

## Next Steps: Build Production Version

Ready to build the **Next.js version** with real APIs? Here's what's needed:

### Prerequisites:
- Node.js 18+ (`node -v` to check)
- pnpm (`npm install -g pnpm`)

### Build Command:
```bash
# I'll scaffold the Next.js app with:
pnpm create next-app@latest steam-arbitrage --typescript --tailwind --app --no-src-dir

# Then you'll install dependencies:
cd steam-arbitrage
pnpm install

# And run:
pnpm dev
```

### Environment Variables:
Create `.env.local` with optional API keys (will use mocks if missing):
```env
STEAM_PARTNER_API_KEY=
SKINPORT_API_KEY=
DMARKET_API_KEY=
FX_API_KEY=
```

---

## Project Files

- `index.html` - Main application page
- `styles.css` - Complete styling with gaming theme
- `script.js` - Mock data simulation and UI interactions
- `detailed_spec_doc.md` - Full UI specification
- `initial prompt.md` - Technical architecture plan

---

**Questions? Ready to build the production version? Let me know!**
