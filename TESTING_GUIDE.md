# Polymarket Analyzer - Testing Guide

## Quick Start
The dev server is already running at: **http://localhost:3000**

---

## Test Scenarios

### 1. Market Card Navigation
**Test**: Click on any market card
**Expected**: Navigate to `/market/[id]` detail page
**How to verify**: URL changes, new page loads

### 2. Active/Closed Filter
**Test**: Click Active/Closed/All buttons in sidebar
**Expected**: Market list updates to show only active or closed markets
**Markets available**:
- Active: Bitcoin, Democrats, Fed Interest Rates (3 markets)
- Closed: Ethereum Shanghai (1 market)

### 3. Category Filter
**Test**: Select different categories from dropdown
**Expected**: Only markets in that category show
**Categories available**:
- Crypto: Bitcoin, Ethereum (2 markets)
- Politics: Democrats (1 market)
- Economics: Fed Interest Rates (1 market)

### 4. Search Functionality
**Test**: Type in search box (e.g., "Bitcoin")
**Expected**: Filters markets by question text in real-time
**Try searching**: "Bitcoin", "Democrats", "Ethereum", "Fed"

### 5. Volume Range Filter
**Test**: Drag volume slider
**Expected**: Markets filtered by 24h volume
**Volume ranges in dataset**:
- Low: $670k (Fed)
- Medium: $890k-$1.25M (Ethereum, Bitcoin)
- High: $3.4M (Democrats)

### 6. Sentiment Filter
**Test**: Click Bullish/Neutral/Bearish buttons
**Expected**: Markets filtered by sentiment score
**Sentiment in dataset**:
- Bullish: Ethereum (0.72), Bitcoin (0.45)
- Neutral: Democrats (-0.12)
- Bearish: Fed (-0.38)

### 7. Sort Functionality
**Test**: Change sort dropdown
**Expected**: Markets reorder
**Sort options**:
- Volume: Democrats first ($3.4M)
- Sentiment: Ethereum first (0.72)
- Liquidity: Democrats first ($1.2M)
- Ending Soon: Ethereum first (Apr 2024)

### 8. Reset Filters
**Test**: Apply filters, then click "Reset"
**Expected**: All filters return to defaults
**Defaults**:
- Status: All
- Category: All Categories
- Volume: Full range
- Sentiment: None selected
- Sort: Highest Volume
- Search: Empty

### 9. Header Navigation
**Test**: Click navigation buttons
**Expected**:
- Markets: Scroll to top
- Portfolio: Alert "Coming soon!"
- Alerts: Alert "Coming soon!"

### 10. Combined Filters
**Test**: Apply multiple filters simultaneously
**Example**: Active + Crypto + Bullish + Search "Bit"
**Expected**: Only Bitcoin market shows (meets all criteria)

---

## Mock Data Reference

### Market 1: Bitcoin
- ID: 1
- Status: Active
- Category: Crypto
- Volume: $1.25M
- Sentiment: Bullish (0.45)

### Market 2: Democrats
- ID: 2
- Status: Active
- Category: Politics
- Volume: $3.4M
- Sentiment: Neutral (-0.12)

### Market 3: Ethereum
- ID: 3
- Status: Closed
- Category: Crypto
- Volume: $890k
- Sentiment: Bullish (0.72)

### Market 4: Fed Interest Rates
- ID: 4
- Status: Active
- Category: Economics
- Volume: $670k
- Sentiment: Bearish (-0.38)

---

## Browser Console Testing

Open browser console (F12) and verify:
- No React errors
- No TypeScript errors
- No hydration mismatches
- Clean console logs

---

## Performance Checks

Watch for:
- Filters update instantly (< 100ms)
- No lag when typing in search
- Smooth scrolling
- No unnecessary re-renders

---

## Edge Cases to Test

1. **Empty Search**: Type "xyz" - Should show "No markets found"
2. **Narrow Volume Range**: Set slider to 0-10% - Should filter out high volume markets
3. **Multiple Sentiments**: Select all three sentiment filters - Should show all markets
4. **Reset While Filtered**: Apply many filters, reset, verify all back to default

---

## Known Working Features

✅ Market card navigation
✅ Active/Closed filter
✅ Category filter dropdown
✅ Search by question text
✅ Volume range slider
✅ Sentiment toggle buttons
✅ Sort by dropdown
✅ Reset filters button
✅ Header search input
✅ Navigation buttons (Markets/Portfolio/Alerts)
✅ Theme toggle (dark mode)

---

## File Structure

```
polymarket-analyzer/
├── lib/
│   └── context/
│       └── FilterContext.tsx (NEW - Global filter state)
├── components/
│   ├── markets/
│   │   └── MarketList.tsx (UPDATED - Navigation + Filtering)
│   └── layout/
│       ├── Sidebar.tsx (UPDATED - Connected to context)
│       └── Header.tsx (UPDATED - Search + Navigation)
└── app/
    └── layout.tsx (UPDATED - FilterProvider wrapper)
```

---

## TypeScript Compilation

Run: `npm run build`
Expected: ✅ Compiled successfully

---

## Development Server

Status: Running on port 3000
Command to restart if needed: `npm run dev`

---

## Next Steps After Testing

If all tests pass:
1. Backend integration (connect to real API)
2. Implement market detail page
3. Add Portfolio functionality
4. Add Alerts system
5. Add mobile responsive filters

---

## Support

All interactive elements are now functional. If you encounter any issues:
1. Check browser console for errors
2. Verify dev server is running
3. Refresh the page
4. Clear browser cache

---

**Happy Testing! 🚀**
