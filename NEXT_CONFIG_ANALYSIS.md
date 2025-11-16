# Next.js Configuration Analysis - Azure Static Web Apps 404 Issue

## Executive Summary

The 404 issue when deployed to Azure Static Web Apps is caused by a **critical mismatch between how the app is configured and how it's being deployed**. The app uses Next.js in `standalone` mode but is being deployed as a **static site** to Azure Static Web Apps, which doesn't support Next.js server-side rendering or dynamic routing.

---

## Current Configuration Analysis

### 1. Next.js Configuration (`next.config.js`)

```javascript
const nextConfig = {
  output: 'standalone',        // ❌ Standalone mode requires Node.js server
  reactStrictMode: true,
  images: {
    domains: ['polymarket.com'],
    unoptimized: true,
  },
  trailingSlash: true,         // ⚠️ Trailing slash enforcement
}
```

**Issues:**
- `output: 'standalone'` - Creates a self-contained Node.js application that requires a server to run
- This mode is designed for Docker, traditional Node.js hosting, or Azure App Service (not Static Web Apps)
- Static Web Apps is a **static hosting platform** - it cannot execute Node.js code or handle dynamic routes

### 2. Build Configuration

**`package.json` build script:**
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

**Dockerfile:**
```dockerfile
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

Both are configured for **server-based deployment**, not static hosting.

### 3. Azure Deployment Configuration

**`staticwebapp.config.json`:**
```json
{
  "platform": {
    "apiRuntime": "node:20"
  },
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "routes": [],
  "responseOverrides": {
    "404": {
      "rewrite": "/404.html"
    }
  }
}
```

**Critical Issues:**
- The config has `navigationFallback` set to rewrite to `/index.html` ✓ (correct)
- But it also expects a `/404.html` static file
- The static site deployment doesn't understand Next.js dynamic routes like `/market/[id]`

### 4. Deployment Workflow (`azure-static-web-apps.yml`)

```yaml
- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    app_location: "/"
    api_location: ""
    output_location: ".next"    # ❌ Wrong output location
    skip_app_build: true
```

**Problems:**
- `output_location: ".next"` - The `.next` directory contains server-side code, not static files
- Should be using `output_location: ".next/static"` or leverage the `standalone` build differently
- `api_location: ""` - No API backend configured

---

## The Core Problem: Architecture Mismatch

### Current Architecture
```
Next.js (standalone mode)
  ↓
  Requires Node.js Server
  ↓
  Docker/Node.js Hosting
```

### Attempted Deployment
```
Next.js (standalone mode)
  ↓
  Deployed to Azure Static Web Apps
  ↓
  Static files only (no Node.js execution)
  ↓
  Dynamic routes fail → 404
```

### Why Routes Fail

1. **App Routes Defined:**
   - `/` (home page) - SSG friendly
   - `/market/[id]` (dynamic route) - requires server-side rendering
   - `/pricing` (static page)
   - `/api/*` (API routes) - require server execution

2. **What Gets Deployed to Static Web Apps:**
   - Only `.next/server/pages/404.html` (static HTML)
   - No server-side rendering capability
   - No dynamic route handling
   - No API route support

3. **Request Flow:**
   ```
   Browser: GET /market/123
   ↓
   Static Web Apps: "Is there a static file at /market/123/?"
   ↓
   File not found (because it's a dynamic route)
   ↓
   Fallback to 404
   ```

---

## Routing Configuration Issues

### From `routes-manifest.json`:
```json
{
  "dynamicRoutes": [
    {"page": "/market/[id]"},
    {"page": "/api/reports/download/[id]"}
  ],
  "staticRoutes": [
    {"page": "/"},
    {"page": "/pricing"}
  ]
}
```

### The Problem:
- Static Web Apps cannot handle **dynamic routes** at all
- Dynamic routes require server-side rendering to work
- The `navigationFallback` rewrites to `/index.html` won't help because the app isn't an SPA

---

## Environment Configuration

### `page.tsx` (Home Page)
```typescript
export const dynamic = 'force-dynamic'
```
- Forces dynamic rendering instead of static generation
- **This cannot work with Static Web Apps**

### `middleware.ts`
```typescript
export const config = {
  matcher: [
    '/api/perplexity/:path*',
    '/api/reports/:path*',
    '/api/v1/:path*',
  ],
};
```
- Middleware for feature gating
- **Requires server execution** - won't work on Static Web Apps

---

## Issues Summary

| Issue | Severity | Impact |
|-------|----------|--------|
| Wrong Next.js output mode | Critical | Can't deploy to Static Web Apps |
| Dynamic routes not supported | Critical | `/market/[id]` returns 404 |
| API routes require server | Critical | No backend functionality |
| Middleware requires server | Critical | Feature gating won't work |
| Force dynamic rendering | High | Static generation not used |
| Missing SPA configuration | High | No client-side routing fallback |

---

## Solutions

### Option 1: Switch to Server-Based Hosting (Recommended)
**Use:** Azure Container Instances, Azure App Service, or Azure Function Apps

**Configuration needed:**
- Keep `output: 'standalone'` in `next.config.js`
- Keep current Node.js deployment
- Update deployment target to Node.js hosting
- API routes will work natively

**Pros:**
- Minimal code changes
- Full Next.js features work
- Server-side rendering for dynamic routes
- Middleware works correctly

**Cons:**
- Higher hosting cost (~$30-100/month)
- Requires managing Node.js runtime

---

### Option 2: Convert to Static Export (Complex)
**Use:** Azure Static Web Apps (current)

**Configuration needed:**

1. **Change `next.config.js`:**
```javascript
const nextConfig = {
  output: 'export',           // ✓ Static export mode
  reactStrictMode: true,
  images: {
    unoptimized: true,        // ✓ Required for static export
  },
  trailingSlash: true,
}
```

2. **Update `package.json`:**
```json
{
  "scripts": {
    "build": "next build && next export",
    "start": "next start"
  }
}
```

3. **Convert dynamic pages to static:**
   - `/market/[id]` → Use `generateStaticParams()` with all market IDs
   - Remove `export const dynamic = 'force-dynamic'`
   - Remove API routes (move to Azure Functions backend)

4. **Configure API separately:**
   - Deploy backend as Azure Functions in `api_location`
   - Frontend calls external API

5. **Update deployment:**
```yaml
output_location: "out"        # Static export output
```

**Pros:**
- Lower hosting cost (~$0-20/month)
- Fast edge caching
- No server needed

**Cons:**
- Build-time generation of all market pages (slow)
- No server-side rendering capability
- API routes must be external
- Middleware won't work
- More complex setup

---

### Option 3: Use Azure Static Web Apps with Node.js Backend (Hybrid)
**Best compromise for current architecture**

1. **Keep `output: 'standalone'`** for .next/standalone folder
2. **Deploy Next.js to Azure Container Instances or App Service**
3. **Use Static Web Apps for static assets only**
4. **Route API calls through reverse proxy**

**Configuration:**
- Front-end CDN: Azure Static Web Apps (static assets)
- Backend API: Azure Container Instances (Node.js)
- Configuration: Point `/api` routes to backend

---

## Recommendation

### For This Project: **Option 1 - Azure App Service**

**Why:**
- Minimal changes needed
- Supports all current features (dynamic routes, API, middleware)
- Moderate cost (~$50-80/month)
- Easy to scale
- Good middle ground

**Implementation:**
1. Keep `output: 'standalone'` (no change needed)
2. Deploy to Azure App Service instead of Static Web Apps
3. Use Docker container (existing Dockerfile works)
4. Update GitHub Actions workflow to deploy to App Service

**Cost comparison:**
- Azure Static Web Apps: ~$0-20/month (broken)
- Azure App Service (B1): ~$50/month (working)
- Azure Container Instances: ~$30-60/month (alternative)

---

## Key Findings

1. **Static Web Apps is incompatible with `output: 'standalone'` mode**
2. **Dynamic routes require server-side rendering**
3. **API routes require Node.js execution**
4. **Current middleware won't work without a server**
5. **`navigationFallback` alone cannot solve the 404 problem**

The deployment architecture is fundamentally mismatched to the hosting platform. A change in hosting is necessary.
