# 🧪 Comprehensive Testing Plan

**Purpose**: Test all features, buttons, LLMs, and functionality
**When**: After frontend deployment is successful
**Estimated Time**: 30-45 minutes

---

## 🎯 Testing Environments

### Local (Available Now)
- **Frontend**: http://localhost:3000 ✅ Running
- **Backend**: http://localhost:7071/api (need to start)
- **Database**: Azure PostgreSQL (accessible)

### Production (After Deployment)
- **Frontend**: https://polymarket-frontend.azurewebsites.net
- **Backend**: https://polymarket-analyzer.azurewebsites.net/api
- **Database**: Azure PostgreSQL

---

## 📋 Test Checklist

### 1️⃣ Frontend UI/UX Tests (10 min)

#### Homepage/Dashboard
- [ ] Page loads without errors
- [ ] Dark theme displays correctly
- [ ] Header with logo/title visible
- [ ] Navigation elements functional
- [ ] Footer displays properly
- [ ] Responsive layout (check browser resize)

#### Market List View
- [ ] Markets display in cards/list
- [ ] Market titles readable
- [ ] Current prices show (YES/NO percentages)
- [ ] Market status indicators visible
- [ ] Loading states work (spinner/skeleton)
- [ ] Empty state message if no markets
- [ ] Scroll functionality works

#### Market Filters (if implemented)
- [ ] Filter buttons respond to clicks
- [ ] Filters update market list
- [ ] Clear filters button works
- [ ] Active filter indicators show

### 2️⃣ Backend API Tests (10 min)

#### Health Endpoint
```bash
# Test command:
curl https://polymarket-analyzer.azurewebsites.net/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-12T...",
  "services": {
    "database": true,
    "polymarket_api": true,
    "perplexity_available": true,
    "azure_openai_available": true,
    "gemini_available": true
  }
}
```

**Checklist**:
- [ ] Returns 200 OK status
- [ ] Response is valid JSON
- [ ] All services show as available
- [ ] Database connection confirmed
- [ ] Response time < 2 seconds

#### Markets Endpoint
```bash
# Test command:
curl https://polymarket-analyzer.azurewebsites.net/api/markets

# Expected: Array of market objects
```

**Checklist**:
- [ ] Returns 200 OK status
- [ ] Returns array of markets
- [ ] Each market has required fields:
  - [ ] `id` or `condition_id`
  - [ ] `title`
  - [ ] `yes_price` or `outcome_prices`
  - [ ] `volume`
  - [ ] `created_at`
- [ ] Prices are numeric (0-1 or 0-100)
- [ ] Response time < 3 seconds
- [ ] Handles empty results gracefully

#### Price History Endpoint
```bash
# Test command:
curl "https://polymarket-analyzer.azurewebsites.net/api/price/TOKEN_ID"

# Replace TOKEN_ID with actual market token
```

**Checklist**:
- [ ] Returns 200 OK for valid token
- [ ] Returns price history array
- [ ] Each entry has timestamp and price
- [ ] Sorted by timestamp (ascending or descending)
- [ ] Returns 404 for invalid token (graceful error)
- [ ] Response time < 2 seconds

### 3️⃣ Multi-LLM Sentiment Analysis (15 min)

This is the **core feature** - most important to test thoroughly!

#### Test Data Preparation
Pick 3 different market scenarios:
1. **Political market** (e.g., "Will X win election?")
2. **Economic market** (e.g., "Bitcoin above $100k?")
3. **Entertainment market** (e.g., "Will X movie win Oscar?")

#### Sentiment Analysis Test

```bash
# Test command:
curl -X POST https://polymarket-analyzer.azurewebsites.net/api/sentiment \
  -H "Content-Type: application/json" \
  -H "x-functions-key: YOUR_FUNCTION_KEY" \
  -d '{
    "market_id": "12345",
    "market_title": "Will Bitcoin reach $100k by end of 2025?"
  }'
```

**For Each Market, Check**:

**1. Response Structure**:
- [ ] Returns 200 OK status
- [ ] Response is valid JSON
- [ ] Contains `consensus_score` (0-100)
- [ ] Contains `consensus_sentiment` (BULLISH/BEARISH/NEUTRAL)
- [ ] Contains `confidence_score` (0-100)
- [ ] Contains `llm_responses` array
- [ ] Response time < 30 seconds

**2. LLM Breakdown**:
- [ ] **Perplexity** response present
  - [ ] `provider: "perplexity"`
  - [ ] `sentiment_score` (0-100)
  - [ ] `confidence` (0-100)
  - [ ] `reasoning` text (non-empty)
  - [ ] `weight: 0.4` (40%)
  - [ ] Optional: `sources` array with citations

- [ ] **GPT-5-Pro** response present
  - [ ] `provider: "azure_openai"`
  - [ ] `sentiment_score` (0-100)
  - [ ] `confidence` (0-100)
  - [ ] `reasoning` text (non-empty)
  - [ ] `weight: 0.4` (40%)

- [ ] **Gemini** response present
  - [ ] `provider: "gemini"`
  - [ ] `sentiment_score` (0-100)
  - [ ] `confidence` (0-100)
  - [ ] `reasoning` text (non-empty)
  - [ ] `weight: 0.2` (20%)

**3. Consensus Calculation**:
- [ ] Consensus formula applied correctly:
  ```
  consensus = Σ(score × confidence × weight) / Σ(confidence × weight)
  ```
- [ ] Consensus matches weighted average (spot check)
- [ ] Sentiment label matches score:
  - [ ] BULLISH: score > 60
  - [ ] BEARISH: score < 40
  - [ ] NEUTRAL: score 40-60

**4. Fallback Behavior**:
Test with one LLM intentionally failing (disconnect API key):
- [ ] System continues with remaining 2 LLMs
- [ ] Weights adjust automatically (remaining LLMs = 100%)
- [ ] Error logged but not exposed to user
- [ ] Response still valid

**5. Key Insights Extraction**:
- [ ] `key_insights` array present
- [ ] Contains 3-5 bullet points
- [ ] Insights are market-specific (not generic)
- [ ] Actionable information provided

**6. Trading Recommendation**:
- [ ] `recommendation` field present
- [ ] One of: BUY, SELL, HOLD, WATCH
- [ ] `risk_level` present (LOW/MEDIUM/HIGH)
- [ ] Recommendation aligns with consensus sentiment

### 4️⃣ Market Detail Page Tests (10 min)

Navigate to individual market page (click on market card):

#### Page Load
- [ ] Market detail page loads
- [ ] URL updates (e.g., `/market/[id]`)
- [ ] Back button works (returns to list)
- [ ] Correct market data displays

#### Market Information Display
- [ ] Market title/question prominent
- [ ] Current YES/NO prices displayed
- [ ] Price formatted correctly (% or decimal)
- [ ] Volume/liquidity shown
- [ ] Market status (open/closed)
- [ ] End date/resolution date

#### Price Chart (if implemented)
- [ ] Chart loads and displays
- [ ] Shows 24-hour price history
- [ ] X-axis: timestamps
- [ ] Y-axis: prices (0-100 or 0-1)
- [ ] Hover tooltips work
- [ ] Chart responsive (resize browser)
- [ ] Loading state before data appears

#### Sentiment Analysis Display
- [ ] Sentiment score visible (large, prominent)
- [ ] Sentiment label (BULLISH/BEARISH/NEUTRAL)
- [ ] Color-coded indicator:
  - [ ] Green for BULLISH
  - [ ] Red for BEARISH
  - [ ] Yellow/orange for NEUTRAL
- [ ] Confidence score displayed

#### LLM Breakdown Section
- [ ] All 3 LLM responses visible
- [ ] Each shows:
  - [ ] Provider name/logo
  - [ ] Individual sentiment score
  - [ ] Confidence percentage
  - [ ] Reasoning text (expandable if long)
  - [ ] Weight percentage (40%, 40%, 20%)
- [ ] Perplexity sources/citations (if available)

#### Trading Recommendation Card
- [ ] Recommendation prominent (BUY/SELL/HOLD/WATCH)
- [ ] Risk level indicator
- [ ] Key insights listed (bullet points)
- [ ] Color-coded based on recommendation

#### Actions/Buttons
- [ ] "Refresh Analysis" button works
- [ ] Shows loading state during refresh
- [ ] Updates data after refresh
- [ ] "View on Polymarket" link (opens external site)
- [ ] Share button (if implemented)

### 5️⃣ Error Handling Tests (5 min)

#### Network Errors
- [ ] Disconnect internet, reload page
- [ ] Error message displays (not crash)
- [ ] "Retry" button available and works
- [ ] Error message user-friendly

#### API Errors
- [ ] Test invalid market ID (404 response)
- [ ] Shows "Market not found" message
- [ ] Test rate limiting (if implemented)
- [ ] Shows appropriate error message

#### Loading States
- [ ] Skeleton loaders during data fetch
- [ ] Spinner for sentiment analysis (slow operation)
- [ ] Disabled buttons during loading
- [ ] No flash of wrong content

### 6️⃣ Performance Tests (5 min)

#### Load Times
- [ ] Homepage loads < 2 seconds
- [ ] Market detail page loads < 3 seconds
- [ ] Sentiment analysis completes < 30 seconds
- [ ] API endpoints respond < 5 seconds

#### Caching Behavior
- [ ] Market list cached (5 min TTL)
- [ ] Second load instant (from cache)
- [ ] Price updates cached (5 sec TTL)
- [ ] Sentiment results cached (check database)

#### Concurrent Requests
- [ ] Open multiple market pages simultaneously
- [ ] All load without errors
- [ ] No race conditions
- [ ] Database connection pool handles load

---

## 🔧 Testing Tools

### Browser DevTools
```
Open: F12 or Right-click → Inspect

Check:
- Console tab: No errors (red messages)
- Network tab: All requests 200 OK (green)
- Performance tab: Load times
- Application tab: Local storage, cache
```

### API Testing
```bash
# Use curl for API tests
curl -v https://polymarket-analyzer.azurewebsites.net/api/health

# Or use Postman:
# - Import endpoints
# - Save as collection
# - Run all tests
```

### Database Verification
```bash
# Connect to PostgreSQL
psql "host=postgres-seekapatraining-prod.postgres.database.azure.com \
      port=6432 \
      dbname=seekapa_training \
      user=seekapaadmin \
      sslmode=require"

# Check tables
\dt

# Check recent sentiment analyses
SELECT * FROM sentiment_data ORDER BY created_at DESC LIMIT 5;

# Check cache hit rate
SELECT
  COUNT(*) as total_requests,
  SUM(CASE WHEN cached = true THEN 1 ELSE 0 END) as cached_requests
FROM api_requests
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 📊 Test Results Template

Copy this for each test session:

```markdown
## Test Session: [Date/Time]

### Environment
- [ ] Local testing
- [ ] Production testing

### Frontend UI/UX
- Passed: X/Y tests
- Failed: [List failed tests]
- Issues: [Describe issues]

### Backend API
- Passed: X/Y tests
- Failed: [List failed tests]
- Issues: [Describe issues]

### Multi-LLM Sentiment
- Passed: X/Y tests
- Failed: [List failed tests]
- LLM response times:
  - Perplexity: X seconds
  - GPT-5-Pro: X seconds
  - Gemini: X seconds
- Consensus accuracy: [Spot check results]

### Market Detail Page
- Passed: X/Y tests
- Failed: [List failed tests]
- Issues: [Describe issues]

### Performance
- Homepage load: X seconds
- Market page load: X seconds
- Sentiment analysis: X seconds
- Cache hit rate: X%

### Critical Issues
1. [Issue 1]
2. [Issue 2]

### Minor Issues
1. [Issue 1]
2. [Issue 2]

### Overall Status
- [ ] Ready for demo
- [ ] Needs fixes before demo
- [ ] Critical blockers present
```

---

## 🚨 Critical Test Priorities

If short on time, test these MUST-HAVE features first:

### Priority 1 (Critical)
1. ✅ Frontend loads without crashes
2. ✅ Backend health endpoint responds
3. ✅ Markets list displays
4. ✅ Sentiment analysis completes successfully
5. ✅ All 3 LLMs return responses

### Priority 2 (Important)
6. Market detail page loads
7. Price charts display
8. Trading recommendations accurate
9. Error handling works
10. Performance acceptable

### Priority 3 (Nice to Have)
11. Filters work
12. Caching optimized
13. Loading states polished
14. Mobile responsive

---

## 🎯 Success Criteria

**Ready for Demo when:**
- [ ] All Priority 1 tests pass
- [ ] At least 80% of Priority 2 tests pass
- [ ] No critical bugs
- [ ] Performance acceptable (< 5 sec for main operations)
- [ ] All 3 LLMs responding consistently

**Ready for Production when:**
- [ ] All tests pass (Priority 1-3)
- [ ] No known bugs
- [ ] Performance optimized
- [ ] Error handling comprehensive
- [ ] User feedback incorporated

---

## 📝 Notes

- **Test systematically**: Don't skip steps
- **Document issues**: Screenshot + description
- **Retest after fixes**: Ensure no regressions
- **Test edge cases**: Empty states, errors, etc.
- **Use real data**: Don't mock everything

---

**Next Step**: Once deployment completes, start with Priority 1 tests!
