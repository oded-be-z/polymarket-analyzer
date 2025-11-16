# Solutions and Recommendations - Fix the 404 Issues

## Problem Statement

Your Next.js app is configured with `output: 'standalone'` (requires Node.js server) but deployed to Azure Static Web Apps (static files only). This causes:

- ❌ `/market/[id]` → 404 (dynamic route needs server)
- ❌ `/api/*` → 404 (API routes need server)
- ❌ Middleware not executing
- ❌ Real-time data not fetching

---

## Solution Options Ranked by Recommendation

### OPTION 1: Azure App Service (⭐ RECOMMENDED)

**Best for:** Your current architecture and timeline

#### Why This Works
- Supports `output: 'standalone'` natively
- Can run Node.js server
- Dynamic routes work
- API routes work
- Middleware executes
- All current features supported

#### Changes Required: Minimal
```yaml
# GitHub Actions Workflow Change
- uses: azure/webapps-deploy@v2          # NEW
  with:
    app-name: 'polymarket-frontend'      # NEW
    package: '.next/standalone'          # NEW

# OR use Docker deployment
- uses: azure/container-instances-deploy@v1
  with:
    image-name: polymarket:latest
    resource-group: AZAI_group
```

#### Cost: $50-100/month
- Azure App Service Plan: $50/month
- Bandwidth: $0-20/month
- Total: ~$50-70/month

#### Configuration: No Changes Needed
```javascript
// next.config.js - NO CHANGES
const nextConfig = {
  output: 'standalone',        // ✓ Works with App Service
  trailingSlash: true,         // ✓ Works fine
}
```

#### Implementation Steps
1. **Create Azure App Service**
   ```bash
   az appservice plan create \
     --name polymarket-plan \
     --resource-group AZAI_group \
     --sku B1 --is-linux
   
   az webapp create \
     --name polymarket-frontend \
     --plan polymarket-plan \
     --resource-group AZAI_group \
     --runtime "NODE|20"
   ```

2. **Update GitHub Workflow**
   ```yaml
   name: Deploy to Azure App Service
   on:
     push:
       branches: [main]
   
   jobs:
     build-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         
         - run: npm ci
         - run: npm run build
         
         - uses: azure/webapps-deploy@v2
           with:
             app-name: polymarket-frontend
             package: '.next/standalone'
             slot-name: production
   ```

3. **Configure Runtime Environment**
   ```bash
   # Set environment variables
   az webapp config appsettings set \
     --name polymarket-frontend \
     --resource-group AZAI_group \
     --settings \
       NODE_ENV=production \
       PORT=8080 \
       NEXT_PUBLIC_BASE_URL=https://polymarket-frontend.azurewebsites.net
   ```

4. **Test Deployment**
   ```bash
   curl https://polymarket-frontend.azurewebsites.net/
   curl https://polymarket-frontend.azurewebsites.net/market/123
   curl https://polymarket-frontend.azurewebsites.net/api/intelligence/brief
   ```

#### Pros
- ✓ Minimal code changes
- ✓ Keep exact current architecture
- ✓ All features work
- ✓ Easy scaling
- ✓ Good performance
- ✓ Integrated with Azure ecosystem

#### Cons
- ✗ Higher cost than Static Web Apps
- ✗ Requires managing Node.js runtime
- ✗ Not a "serverless" solution

#### Migration Path
```
Static Web Apps (broken)
       ↓
    [Change deployment only]
       ↓
App Service (working)
```

---

### OPTION 2: Azure Container Instances (☆ ALTERNATIVE)

**Best for:** Docker deployments and cost optimization

#### Why This Works
- Runs Docker container with Node.js
- All features supported
- Slightly cheaper than App Service
- Easy to scale

#### Cost: $30-60/month
- Container Instances: ~$30-40/month (if running 24/7)
- Storage: ~$5/month
- Total: ~$35-50/month

#### Changes Required: Minimal
```yaml
# Use existing Dockerfile (no changes needed)
FROM node:18-alpine
...
CMD ["node", "server.js"]
```

#### Implementation Steps
1. **Build Docker Image**
   ```bash
   docker build -t polymarket:latest .
   ```

2. **Push to Azure Container Registry**
   ```bash
   az acr create \
     --resource-group AZAI_group \
     --name polymarketregistry \
     --sku Basic
   
   az acr build \
     --registry polymarketregistry \
     --image polymarket:latest .
   ```

3. **Deploy to Container Instances**
   ```bash
   az container create \
     --resource-group AZAI_group \
     --name polymarket-app \
     --image polymarketregistry.azurecr.io/polymarket:latest \
     --port 3000 \
     --environment-variables \
       NODE_ENV=production \
       NEXT_PUBLIC_BASE_URL=https://[instance-ip]:3000 \
     --dns-name-label polymarket-frontend
   ```

4. **Update GitHub Workflow**
   ```yaml
   - uses: azure/CLI@v1
     with:
       inlineScript: |
         az container create \
           --resource-group AZAI_group \
           --name polymarket-app \
           --image polymarketregistry.azurecr.io/polymarket:latest \
           --cpu 1 --memory 1
   ```

#### Pros
- ✓ Uses existing Dockerfile
- ✓ Slightly cheaper than App Service
- ✓ Container-based (good for CI/CD)
- ✓ All features work
- ✓ Easy to version/rollback

#### Cons
- ✗ Requires Docker knowledge
- ✗ Container Registry adds cost (~$5/month)
- ✗ Slightly more complex setup

---

### OPTION 3: Vercel (☆ EASIEST but vendor lock-in)

**Best for:** If you want one-click Next.js deployment

#### Why This Works
- Built specifically for Next.js
- Automatic deployments
- All features work out of the box
- Serverless functions for API routes

#### Cost: $20/month (Pro) or free (hobby)

#### Changes Required: None
```javascript
// next.config.js - NO CHANGES NEEDED
const nextConfig = {
  output: 'standalone',  // ✓ Vercel handles this
}
```

#### Implementation Steps
1. **Connect GitHub to Vercel**
   - Sign up at vercel.com
   - Import your GitHub repo

2. **Environment Variables**
   ```
   STRIPE_SECRET_KEY = [your-key]
   PERPLEXITY_API_KEY = [your-key]
   ```

3. **Deploy**
   - Push to main branch
   - Vercel auto-deploys

#### Pros
- ✓ Easiest setup
- ✓ Zero configuration needed
- ✓ Best performance for Next.js
- ✓ Edge caching included
- ✓ Free tier available

#### Cons
- ✗ Vendor lock-in (Vercel only)
- ✗ Costs more if you scale
- ✗ Leaves Azure ecosystem

---

### OPTION 4: Rebuild for Static Export (⚠️ NOT RECOMMENDED)

**Best for:** If you absolutely must use Static Web Apps and accept limitations

#### Why This Is Hard
- Requires major code changes
- No dynamic routes
- No API routes
- No middleware
- Build time regeneration of all markets

#### Cost: $0-20/month (Static Web Apps)

#### Changes Required: Substantial
```javascript
// next.config.js - MUST CHANGE
const nextConfig = {
  output: 'export',              // ← CHANGE
  reactStrictMode: true,
  images: {
    unoptimized: true,           // ← REQUIRED for export
  },
}
```

```typescript
// app/page.tsx - MUST CHANGE
// Remove: export const dynamic = 'force-dynamic'

// app/market/[id]/page.tsx - MUST ADD
export async function generateStaticParams() {
  // Need to know all market IDs at build time
  const markets = await fetch('https://polymarket.api...')
  return markets.map(m => ({ id: m.id }))
}
```

```json
// package.json - MUST CHANGE
{
  "scripts": {
    "build": "next build && next export"  // ← CHANGE
  }
}
```

#### Implementation Steps
1. **Change Output Mode**
   ```bash
   # Update next.config.js: output: 'export'
   # Update package.json: add "next export"
   ```

2. **Add Static Generation**
   ```bash
   # For each dynamic page, add generateStaticParams()
   # This requires knowing all parameters at build time
   ```

3. **Remove Server Features**
   ```bash
   # Delete all API routes (move to external API)
   # Delete middleware
   # Remove force-dynamic from pages
   ```

4. **Deploy External API**
   ```bash
   # Deploy backend separately (Azure Functions, Flask, etc.)
   # Frontend calls external API for data
   ```

#### Pros
- ✓ Cheapest option
- ✓ Fastest edge delivery
- ✓ No server management

#### Cons
- ✗ Massive code refactor
- ✗ Build time increases (generate all pages)
- ✗ No real-time data
- ✗ No API routes
- ✗ No middleware
- ✗ Complex to maintain
- ✗ Extensive testing required

#### Not Recommended Because
- 80% of app features don't work
- Would take 2-3 weeks to refactor
- Higher maintenance burden
- Real-time sentiment data won't work
- API routes need complete rewrite

---

## Recommendation Summary

| Option | Cost | Setup Time | Effort | Recommendation |
|--------|------|-----------|--------|-----------------|
| **App Service** | $50/mo | 30 min | Low | ⭐⭐⭐ BEST |
| **Container Inst.** | $35/mo | 1 hour | Medium | ⭐⭐ GOOD |
| **Vercel** | $20/mo | 5 min | None | ⭐⭐ EASY |
| **Static Export** | $10/mo | 2 weeks | Very High | ⚠️ NOT REC. |

---

## My Recommendation: Azure App Service

### Why
1. **Minimal changes** - Keep your current code exactly as-is
2. **Quick migration** - 30 minutes to set up
3. **Reasonable cost** - $50-70/month is acceptable for what you get
4. **Stays in Azure** - Keep your ecosystem consistent
5. **Proven solution** - Works perfectly for standalone Next.js apps
6. **Easy scaling** - Simple to upgrade if needed

### Quick Start (15 minutes)
```bash
# 1. Create App Service
az appservice plan create \
  --name polymarket-plan \
  --resource-group AZAI_group \
  --sku B1 --is-linux

az webapp create \
  --name polymarket-frontend \
  --plan polymarket-plan \
  --resource-group AZAI_group \
  --runtime "NODE|20"

# 2. Update GitHub Actions (see template above)
# 3. Push to main branch
# 4. App deploys automatically
```

### Verification Checklist
```bash
# After deployment, run these to verify:
curl https://polymarket-frontend.azurewebsites.net/          # Should work
curl https://polymarket-frontend.azurewebsites.net/pricing   # Should work
curl https://polymarket-frontend.azurewebsites.net/market/123 # Should work
curl https://polymarket-frontend.azurewebsites.net/api/intelligence/brief # Should work
```

---

## If You Choose App Service: Migration Checklist

- [ ] Create App Service Plan (`az appservice plan create`)
- [ ] Create Web App (`az webapp create`)
- [ ] Set Node.js version to 20 (`az webapp config set --linux-fx-version NODE|20`)
- [ ] Set environment variables for production
- [ ] Update GitHub Actions workflow to use `azure/webapps-deploy@v2`
- [ ] Test deployment with `az deployment`
- [ ] Verify all routes work (/, /pricing, /market/123, /api/*)
- [ ] Remove Static Web Apps from Azure (if continuing to use it)
- [ ] Monitor logs with `az webapp log tail --name polymarket-frontend`

---

## Cost Comparison Over Time

```
Month 1 (Setup):
- App Service: $50
- Container Registry: $5
- Container Instances: $40
Total: $95 (one-time setup cost)

Month 2-12 (Ongoing):
- App Service: $50/month

Over 1 year:
- Static Web Apps (broken): $0 (not working)
- App Service: $650 total (~$54/month)
- Container Instances: $500 total (~$42/month)
- Static Web Apps rebuilt: $20 + 2 weeks dev time
```

---

## Next Steps

### Immediate (Today)
1. ✓ Read this document
2. ✓ Understand the problem
3. ✓ Choose a solution

### Short Term (This Week)
1. Create App Service Plan
2. Create Web App
3. Update GitHub Actions
4. Test deployment

### Before Launch
1. Performance testing
2. Security audit
3. Monitoring setup
4. Backup configuration

---

## Questions to Ask Yourself

**Q: Can I afford $50-70/month?**
- Yes → Use App Service (RECOMMENDED)
- No → Use Static Web Apps rebuild (not recommended) or find a different solution

**Q: Do I want zero configuration?**
- Yes → Use Vercel (but leaves Azure)
- No → Use App Service (flexible, in Azure)

**Q: Must I use Azure?**
- Yes → Use App Service
- No → Use Vercel (easier, faster)

**Q: How soon do I need this fixed?**
- ASAP (< 1 hour) → App Service
- This week → Container Instances
- Can wait → Static Web Apps rebuild

---

## Summary

Your current 404 errors are caused by an **architecture mismatch**, not a configuration error. You have three good options:

1. **Azure App Service** - Best for staying in Azure, minimal changes
2. **Container Instances** - Good if you prefer Docker, slightly cheaper
3. **Vercel** - Easiest setup, but leaves Azure ecosystem

**Recommended: Azure App Service** - Takes 30 minutes to set up, costs $50-70/month, fixes all 404 issues.

The Static Web Apps rebuild is possible but would take 2-3 weeks and remove 80% of your app's functionality. Not recommended.
