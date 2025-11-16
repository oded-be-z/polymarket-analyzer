# Deployment Quick Reference - Configuration Overview

## Current Configuration Status

### next.config.js
```javascript
output: 'standalone'              ❌ Wrong for Static Web Apps
reactStrictMode: true             ✓ OK
images.unoptimized: true          ✓ OK
trailingSlash: true               ⚠️ Can cause issues
```

### package.json
```json
"build": "next build"             ❌ No static export
"start": "next start"             ⚠️ Requires Node.js
"dependencies": {
  "next": "14.0.4"                ✓ Version OK
}
```

### staticwebapp.config.json
```json
"navigationFallback": {
  "rewrite": "/index.html"        ⚠️ Not enough for dynamic routes
},
"routes": []                       ❌ Empty, no routing rules
"responseOverrides.404": {
  "rewrite": "/404.html"          ⚠️ File won't exist
}
```

### Dockerfile
```dockerfile
COPY --from=builder /app/.next/standalone ./    ❌ Wrong for Static Web Apps
CMD ["node", "server.js"]                        ❌ Requires Node.js
```

### GitHub Actions Workflow (azure-static-web-apps.yml)
```yaml
output_location: ".next"          ❌ Wrong - contains server code
api_location: ""                  ❌ No backend configured
skip_app_build: true              ⚠️ Builds locally but skips deploy build
```

### Middleware (middleware.ts)
```typescript
export const config = {
  matcher: [
    '/api/perplexity/:path*',     ❌ Requires server
    '/api/reports/:path*',        ❌ Requires server
  ],
};
```

### Home Page (app/page.tsx)
```typescript
export const dynamic = 'force-dynamic'    ❌ Requires server
```

---

## What Works vs. What Doesn't

### ✓ Works on Current Static Web Apps Deployment
- Homepage `/` (if served as static HTML)
- Static CSS/JavaScript
- Static images
- Browser-side functionality

### ❌ Doesn't Work
- `/market/[id]` - Dynamic route (requires server)
- `/pricing` - Might work if static (but not guaranteed)
- `/api/*` - API routes (require server)
- Middleware execution
- Real-time data fetching
- Server-side rendering

---

## File Structure Analysis

### What Actually Gets Deployed
```
.next/
├── server/
│   └── pages/
│       └── 404.html              ← Only static HTML file
├── static/
│   ├── chunks/
│   │   └── [JS bundles]          ← JavaScript code
│   ├── css/
│   │   └── [CSS files]           ← Stylesheets
│   └── [BUILD_ID]/
├── app-build-manifest.json
├── routes-manifest.json          ← Tells Next.js about routes
└── [other metadata]
```

### Problems
1. `.next/server` contains server logic (won't execute on Static Web Apps)
2. `routes-manifest.json` lists dynamic routes that can't be served
3. No pre-rendered HTML for dynamic routes
4. API routes have no execution environment

---

## Routes That Fail and Why

| Route | Type | Current Status | Required for Execution |
|-------|------|-----------------|------------------------|
| `/` | Static | ⚠️ Might work | Served as /index.html |
| `/pricing` | Static | ⚠️ Might work | Served as /pricing.html |
| `/market/[id]` | Dynamic | ❌ 404s | Server-side rendering |
| `/api/intelligence/brief` | API | ❌ 404s | Node.js execution |
| `/api/reports/generate` | API | ❌ 404s | Node.js execution |
| `/api/subscriptions/*` | API | ❌ 404s | Node.js execution |

---

## Key Configuration Values

### From routes-manifest.json
```json
{
  "version": 3,
  "pages404": true,              ← Has 404 handling
  "dynamicRoutes": [             ← Can't work on Static Web Apps
    {
      "page": "/market/[id]",
      "regex": "^/market/([^/]+?)(?:/)?$"
    }
  ],
  "staticRoutes": [              ← Can work
    {
      "page": "/",
      "regex": "^/(?:/)?$"
    },
    {
      "page": "/pricing",
      "regex": "^/pricing(?:/)?$"
    }
  ]
}
```

### From required-server-files.json
```json
{
  "config": {
    "output": "standalone",       ← Confirms server mode
    "images": {
      "unoptimized": true
    }
  },
  "files": [
    ".next/routes-manifest.json",
    ".next/server/...",           ← Server files
    ".next/app-build-manifest.json"
  ]
}
```

---

## Environment Analysis

### What the App Expects
- Node.js runtime (required for `standalone` mode)
- Server to handle middleware
- Server to execute API routes
- Server for dynamic page rendering
- `force-dynamic` rendering capability

### What Static Web Apps Provides
- Static file serving only
- Basic routing via `staticwebapp.config.json`
- Fallback to `navigationFallback`
- No Node.js execution
- No middleware support
- No dynamic rendering

---

## Deployment Configuration Issues

### Issue #1: Wrong Output Location
```yaml
# Current (WRONG)
output_location: ".next"

# Why it's wrong:
# .next folder contains:
# - server/ (Node.js code that won't execute)
# - static/ (static files that work)
# - metadata files (not needed)

# What actually works:
output_location: ".next/static"  # Only static assets
```

### Issue #2: Missing Routes Configuration
```json
{
  "routes": []                    // Empty!
}

// Should have:
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated", "anonymous"]
    },
    {
      "route": "/market/*",
      "serve": "/market/[id].html"
    }
  ]
}

// But this won't work either because /market/[id].html doesn't exist
// (dynamic pages need server rendering)
```

### Issue #3: Inadequate Fallback
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}

// Problems:
// 1. Rewrites ALL missing paths to /index.html
// 2. Only works if app is a single-page app (SPA)
// 3. This isn't a SPA - it's a server-rendered app
```

### Issue #4: Wrong Build Output
```yaml
# Configured for:
app_location: "/"
output_location: ".next"

# But:
# .next is built for Node.js server, not static serving
# Static Web Apps expects an "out" folder (from `next export`)
# or properly structured static files
```

---

## What Each File Tells Us

| File | Shows | Status |
|------|-------|--------|
| `next.config.js` | App built for server | ❌ Incompatible |
| `.next/routes-manifest.json` | Dynamic routes exist | ❌ Can't serve |
| `.next/server/` | Server code included | ❌ Won't execute |
| `staticwebapp.config.json` | Static hosting config | ⚠️ Incomplete |
| `middleware.ts` | Middleware present | ❌ Won't run |
| `app/page.tsx` | `force-dynamic` used | ❌ Requires server |
| `app/api/**` | API routes exist | ❌ Won't execute |
| `Dockerfile` | Node.js deployment | ❌ Wrong platform |

---

## The Execution Chain Breakdown

### Ideal Flow (What Should Happen)
```
Build Machine:
  ✓ npm run build
  ✓ Generate .next/standalone
  ✓ Create server.js entry point

Deployment:
  ✓ Azure App Service (Node.js capable)
  ✓ Docker on Container Instances
  ✓ Any Node.js host

Runtime:
  ✓ Server starts
  ✓ Listens on port 3000
  ✓ Handles all requests
  ✓ Dynamic routes work
  ✓ API routes execute
  ✓ Middleware runs
```

### Actual Flow (What Happens Now)
```
Build Machine:
  ✓ npm run build
  ✓ Generate .next/standalone

Deployment (WRONG PLATFORM):
  ✗ Azure Static Web Apps (static only)
  ✗ Only copies static files
  ✗ Ignores server code
  ✗ No Node.js available

Runtime (BROKEN):
  ✗ No server starts
  ✗ Static file server only
  ✗ Dynamic routes return 404
  ✗ API routes return 404
  ✗ Middleware never runs
```

---

## Breaking It Down by URL

### What Happens When You Visit: `https://[your-app].azurestaticapps.net/market/123`

```
1. Browser sends: GET /market/123
   
2. Azure Static Web Apps receives request
   
3. Checks: Is there a file at /market/123?
   └─→ No

4. Checks: Is there a file at /market/123/index.html?
   └─→ No (would only exist if we pre-rendered all markets)

5. Checks: Is there a routing rule for /market/*?
   └─→ Empty routes array, so NO

6. Fallback: navigationFallback rewrites to /index.html
   └─→ Serves home page

7. Browser receives: /index.html (home page content)
   
8. Browser loads home page
   
9. User sees: Wrong page content
   └─→ OR 404 if navigationFallback isn't configured correctly
```

---

## Why Trailing Slash Causes Issues

```javascript
trailingSlash: true
```

**What this does:**
- `/market/123` → redirects to `/market/123/`
- Tries to find `/market/123/index.html`
- Static Web Apps can't handle this redirect properly
- Results in 404 or broken redirects

---

## Summary Table: Config vs. Platform

```
┌──────────────────────────────┬──────────────┬──────────────────┐
│ Configuration                │ Expects      │ Azure Provides   │
├──────────────────────────────┼──────────────┼──────────────────┤
│ output: 'standalone'         │ Node.js      │ Static files     │
│ API routes                   │ Server       │ ❌ None          │
│ Middleware                   │ Server       │ ❌ None          │
│ Dynamic routes               │ Server       │ ❌ None          │
│ force-dynamic rendering      │ Server       │ ❌ Can't render  │
│ Trailing slash enforcement   │ Server       │ ⚠️ Issues        │
│ .next/server files           │ Execution    │ ❌ Ignored       │
│ .next/static files           │ Serving      │ ✓ Works          │
└──────────────────────────────┴──────────────┴──────────────────┘
```

---

## Bottom Line

The app is configured and built for a **Node.js server-based platform** but deployed to a **static file hosting platform**. 

Every feature beyond static page serving will fail:
- Dynamic routes ❌
- API calls ❌
- Middleware ❌
- Server-side data fetching ❌

**This is not a configuration fix - it's an architecture mismatch.**
