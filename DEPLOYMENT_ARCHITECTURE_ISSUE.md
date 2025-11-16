# Deployment Architecture Issue - Visual Explanation

## The Problem in One Image

```
┌─────────────────────────────────────────────────────────────┐
│  CURRENT SETUP: Architecture Mismatch                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  App Built For:              Deployed To:                   │
│  ┌──────────────────┐        ┌──────────────────────┐       │
│  │ Next.js          │   →    │ Azure Static Web     │       │
│  │ standalone mode  │        │ Apps (static only)   │       │
│  │                  │        │                      │       │
│  │ Features:        │        │ Features:            │       │
│  │ • SSR            │        │ • Static files       │       │
│  │ • API routes     │        │ • No Node.js         │       │
│  │ • Middleware     │        │ • No server code     │       │
│  │ • Dynamic routes │        │ • No execution       │       │
│  └──────────────────┘        └──────────────────────┘       │
│         ❌ INCOMPATIBLE ❌                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## What Happens When You Request a Dynamic Route

```
User Browser Request:
GET /market/123

        ↓

Azure Static Web Apps:
"Looking for /market/123/index.html or /market/123.html..."

        ↓

File System Check:
        │
        ├─→ /market/123/index.html ? ❌ NOT FOUND
        ├─→ /market/123.html ? ❌ NOT FOUND
        ├─→ /market/123 file? ❌ NOT FOUND
        │
        └─→ navigationFallback tries /index.html ✓ FOUND
            But /index.html is the home page, not the market page!
            
        ↓

User Sees:
❌ 404 Error (or home page)
❌ Wrong content served
```

---

## Configuration vs. Reality

### What You Told Next.js
```javascript
// next.config.js
output: 'standalone'    // "I want to run this on a Node.js server"
```

### What You Told Azure
```yaml
# GitHub Actions
uses: Azure/static-web-apps-deploy@v1
output_location: ".next"    // "Deploy the .next folder as static files"
```

### The Disconnect
```
Next.js says:      "I built a server-side app"
Azure says:        "I only host static files"
Result:            💥 Incompatibility
```

---

## Why Each Component Fails

### Dynamic Routes
```typescript
// app/market/[id]/page.tsx
export default function MarketDetail({ params }) {
  return <div>Market {params.id}</div>
}
```

**What you need:** Server that runs this code for `/market/123`
**What you have:** Static files only

→ **Result:** 404 on `/market/123`

---

### API Routes
```typescript
// app/api/intelligence/brief/route.ts
export async function GET(request: Request) {
  // Fetch data
  return Response.json(data)
}
```

**What you need:** Node.js server to execute this route
**What you have:** Static files only

→ **Result:** API returns 404, app breaks

---

### Middleware
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Check feature access
  return NextResponse.next()
}
```

**What you need:** Server to run middleware on each request
**What you have:** Static files only

→ **Result:** Middleware never executes, feature gates don't work

---

### Force Dynamic Rendering
```typescript
// app/page.tsx
export const dynamic = 'force-dynamic'
```

**What you need:** Server to render on every request
**What you have:** Static files only (built once at deploy time)

→ **Result:** Can't fetch fresh data

---

## File System Reality on Azure Static Web Apps

After deployment to Azure Static Web Apps, your app contains:

```
.next/
├── server/          ← These files DO get deployed
│   └── pages/
│       └── 404.html    ← One static 404 page
├── static/          ← These get deployed
│   └── chunks/
│       └── [JS bundles]
└── [other metadata]

public/             ← Static assets (if any)
```

**When a request comes in:**
1. Azure checks if static file exists at path
2. If not, applies `navigationFallback` rewrites to `/index.html`
3. Serves the home page for ALL routes that don't have static files
4. User sees wrong content or gets lost

---

## Cost & Complexity Comparison

```
┌──────────────────────────────────────────────────────────────────┐
│ OPTION                    │ COST      │ WORK    │ FEATURES        │
├──────────────────────────────────────────────────────────────────┤
│ Static Web Apps           │ $0-20/mo  │ High    │ Static only     │
│ (Current - Broken)        │           │ Rebuild │ ❌ Dynamic      │
│                           │           │ app     │ ❌ API routes   │
│                           │           │         │ ❌ Middleware   │
├──────────────────────────────────────────────────────────────────┤
│ Azure App Service (B1)    │ ~$50/mo   │ Low     │ All features    │
│ (RECOMMENDED)             │           │ Keep    │ ✓ Dynamic       │
│                           │           │ current │ ✓ API routes    │
│                           │           │ config  │ ✓ Middleware    │
├──────────────────────────────────────────────────────────────────┤
│ Container Instances       │ ~$30/mo   │ Low     │ All features    │
│ (Alternative)             │           │ Keep    │ ✓ Dynamic       │
│                           │           │ current │ ✓ API routes    │
│                           │           │ config  │ ✓ Middleware    │
├──────────────────────────────────────────────────────────────────┤
│ Static Web Apps + Rebuild │ $0-20/mo  │ Very    │ Static only     │
│ (Feasible but hard)       │           │ High    │ ✓ Dynamic (via  │
│                           │           │ Lots of │   static gen)   │
│                           │           │ changes │ ✗ API routes    │
│                           │           │ Testing │ ✗ Real-time     │
│                           │           │         │   data          │
└──────────────────────────────────────────────────────────────────┘
```

---

## The Real Issues in next.config.js

```javascript
const nextConfig = {
  output: 'standalone',     // ← Problem #1
                            //   Can't use with Static Web Apps
                            
  trailingSlash: true,      // ← Minor issue
                            //   Static Web Apps will struggle
                            //   with trailing slash enforcement
}
```

### Why `output: 'standalone'`?

**What it means:**
- Creates a `.next/standalone` folder with Node.js server
- Self-contained application
- Can be packaged in Docker
- Requires `node server.js` to run

**Where it works:**
- ✓ Docker
- ✓ Azure App Service
- ✓ Azure Container Instances
- ✓ Any Node.js host
- ✗ Azure Static Web Apps
- ✗ Netlify Functions
- ✗ Vercel (Vercel has its own deployment)

---

## Configuration Mismatch Evidence

### Evidence #1: Deployment Workflow
```yaml
output_location: ".next"
```
→ Trying to deploy .next folder with server code as static files

### Evidence #2: Next.js Config
```javascript
output: 'standalone'
```
→ Building for server-based hosting

### Evidence #3: Dockerfile
```dockerfile
CMD ["node", "server.js"]
```
→ Expects to run Node.js server

### Evidence #4: Azure Config
```json
{
  "apiRuntime": "node:20",
  "routes": []
}
```
→ Says it supports Node.js, but routes are empty (Static Web Apps can't route to Node.js)

---

## Quick Fix Matrix

| Want This | Need This | Effort |
|-----------|-----------|--------|
| Keep current code | Azure App Service | ⭐ Low - change workflow only |
| Keep current code | Container Instances | ⭐ Low - change workflow only |
| Static Web Apps | Rebuild entire app | ⭐⭐⭐⭐ Very High |
| Docker deployment | Keep everything | ⭐ Low - already have Dockerfile |

---

## Summary: Why 404s Happen

1. **You built:** A full-stack Next.js app with server rendering
2. **You deployed to:** A static file host with no server
3. **You requested:** `/market/123` (dynamic route)
4. **The host looked for:** `/market/123/index.html` (static file)
5. **The host found:** Nothing (dynamic routes need server)
6. **The host returned:** 404

This is not a configuration bug - it's an architectural mismatch. The app was built for the wrong platform.
