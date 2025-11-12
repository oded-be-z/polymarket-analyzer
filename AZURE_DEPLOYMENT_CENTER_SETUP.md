# Azure Deployment Center - GitHub Actions Setup

**Manual fix failed** - npm install + build on startup is too slow (times out)
**Better solution** - Use Azure Deployment Center to auto-configure GitHub Actions

---

## 🎯 Quick Setup (Via Azure Portal - 3 minutes)

### Step 1: Open Deployment Center

1. Go to: https://portal.azure.com
2. Navigate to: **polymarket-frontend** Web App
3. In left menu, click: **Deployment Center**

### Step 2: Configure GitHub Actions

1. **Source**: Select **GitHub**
2. **Organization**: Select your GitHub account
3. **Repository**: Select `polymarket-analyzer` (or your repo name)
4. **Branch**: Select `feature/polymarket-web-app` (or `main`)

### Step 3: Build Configuration

1. **Runtime stack**: Node.js
2. **Version**: 20 LTS
3. **Build command**: `npm run build`
4. **Start command**: `npm start`

### Step 4: Save

1. Click **Save** at the top
2. Azure will automatically:
   - Create GitHub Actions workflow file
   - Add deployment credentials as GitHub secret
   - Commit workflow to your repository
   - Trigger first deployment

---

## ⏱️ What Happens Next

1. **Immediate** (5 seconds): Azure creates workflow file
2. **Within 1 minute**: Workflow appears in GitHub repo
3. **Within 5 minutes**: First deployment completes
4. **Result**: Frontend accessible at https://polymarket-frontend.azurewebsites.net

---

## 🔍 Monitor Progress

**In Azure Portal:**
- Deployment Center → Logs tab
- Shows deployment progress in real-time

**In GitHub:**
- Go to repository → Actions tab
- Watch "Build and deploy Node.js app to Azure Web App" workflow

---

## ✅ Advantages of This Method

- ✅ Azure auto-configures everything
- ✅ No manual secret setup needed
- ✅ Proper build process (not on startup)
- ✅ Fast deployments (pre-built artifacts)
- ✅ Future pushes auto-deploy
- ✅ Azure and GitHub automatically synced

---

## 🔄 Alternative: Use Our Pre-Made Workflow

If you prefer using the workflow I already created:

1. Add GitHub secret `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Content from: `azure-publish-profile-SENSITIVE.xml`
2. Push to GitHub: `git push origin feature/polymarket-web-app`
3. Watch deployment in GitHub Actions

Both methods work - Deployment Center is just more automated.

---

## 📊 Why Manual Fix Failed

The startup command approach failed because:
- `npm install` takes 30-60 seconds
- `npm run build` takes another 60-90 seconds
- Total: 2-3 minutes to start
- Azure timeout: 10 minutes (but health check times out sooner)

**GitHub Actions fixes this by**:
- Building BEFORE deployment (not during startup)
- Deploying pre-built artifacts
- Startup time: ~5-10 seconds instead of 3 minutes

---

## 🎯 Recommendation

**Use Deployment Center** (easier, Azure does everything)
- 3 minute setup via portal
- No manual steps
- Azure handles all configuration

---

**Ready when you are!** Just open Deployment Center in Azure Portal and follow the steps above.
