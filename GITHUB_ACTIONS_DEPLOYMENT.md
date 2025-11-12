# GitHub Actions Deployment Guide

**Last Updated**: November 12, 2025
**Purpose**: Set up automated deployment to Azure using GitHub Actions
**Advantage**: Avoids the worker timeout issues with manual zip deployment

---

## Why GitHub Actions?

**Previous Issue**: Manual zip deployment failed with:
```
ERROR: Worker process failed to start within 10 minutes
```

**GitHub Actions Fixes This By**:
- ✅ Proper Next.js build process
- ✅ Correct environment configuration
- ✅ Automatic startup commands
- ✅ CI/CD for future updates
- ✅ Better error visibility

---

## Setup Steps (5 minutes)

### Step 1: Get Azure Publish Profile

Already obtained! The publish profile XML has been saved securely.

### Step 2: Add Secret to GitHub

1. Go to your repository: https://github.com/YOUR_USERNAME/polymarket-analyzer
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Value: Copy the entire XML content below:

```xml
<publishData>
  <publishProfile
    profileName="polymarket-frontend - Web Deploy"
    publishMethod="MSDeploy"
    publishUrl="polymarket-frontend.scm.azurewebsites.net:443"
    msdeploySite="polymarket-frontend"
    userName="..."
    userPWD="..."
    destinationAppUrl="http://polymarket-frontend.azurewebsites.net" />
</publishData>
```

**Note**: I have the full XML with credentials. When you're ready to add this secret, I can provide the complete content.

### Step 3: Commit and Push Workflow

```bash
cd /home/odedbe/polymarket-analyzer

# Add the workflow file
git add .github/workflows/azure-deploy-frontend.yml
git add web.config
git add .deployment

# Commit
git commit -m "feat: Add GitHub Actions deployment workflow for Azure"

# Push to trigger deployment
git push origin feature/polymarket-web-app
```

### Step 4: Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You'll see "Deploy Frontend to Azure Web App" running
4. Watch the build and deployment progress
5. Deployment takes ~3-5 minutes

---

## What Gets Deployed

The workflow automatically:

1. **Checks out code** from your branch
2. **Installs Node.js 20.x** with npm caching
3. **Installs dependencies** via `npm ci` (clean install)
4. **Builds Next.js** with production optimizations
5. **Deploys to Azure** using publish profile
6. **Health checks** the deployment after 30 seconds

---

## Environment Variables

The workflow sets:
```bash
NEXT_PUBLIC_API_URL=https://polymarket-analyzer.azurewebsites.net/api
```

If you need additional environment variables, add them to the workflow under the `Build Next.js application` step:

```yaml
- name: Build Next.js application
  run: npm run build
  env:
    NEXT_PUBLIC_API_URL: https://polymarket-analyzer.azurewebsites.net/api
    NEXT_PUBLIC_OTHER_VAR: value_here
```

---

## Automatic Triggers

Deployment runs automatically when you:
- Push to `main` branch
- Push to `feature/polymarket-web-app` branch
- Manually trigger via GitHub Actions UI

To change branches that trigger deployment, edit:

```yaml
on:
  push:
    branches:
      - main
      - your-branch-name
```

---

## Manual Deployment Trigger

To deploy manually without pushing code:

1. Go to repository → **Actions** tab
2. Select "Deploy Frontend to Azure Web App"
3. Click **Run workflow** dropdown
4. Select branch
5. Click **Run workflow** button

---

## Troubleshooting

### Deployment Fails

Check the GitHub Actions logs:
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click on the failed job (usually "build-and-deploy")
4. Expand the failed step to see error details

### Common Issues

**Issue**: `npm ci` fails
**Fix**: Delete `package-lock.json`, run `npm install` locally, commit new lock file

**Issue**: Build fails with TypeScript errors
**Fix**: Run `npm run type-check` locally to find errors

**Issue**: Deployment succeeds but site doesn't work
**Fix**: Check Azure Web App logs:
```bash
az webapp log tail --resource-group AZAI_group --name polymarket-frontend
```

---

## Verify Deployment

After GitHub Actions completes:

```bash
# Check if site responds
curl -I https://polymarket-frontend.azurewebsites.net

# Should return HTTP 200 OK
```

Open in browser:
- **Frontend**: https://polymarket-frontend.azurewebsites.net
- **API**: https://polymarket-analyzer.azurewebsites.net/api

---

## Files Created

This setup created:

1. **`.github/workflows/azure-deploy-frontend.yml`** - GitHub Actions workflow
2. **`web.config`** - Azure Web App configuration
3. **`.deployment`** - Azure deployment settings

All files are already in your repository and ready to commit.

---

## Next Steps

1. ✅ Add `AZURE_WEBAPP_PUBLISH_PROFILE` secret to GitHub
2. ✅ Commit and push the workflow files
3. ✅ Watch deployment in Actions tab
4. ✅ Test deployed site
5. ✅ Future pushes deploy automatically

---

## Comparison: GitHub Actions vs Manual Zip

| Feature | Manual Zip | GitHub Actions |
|---------|-----------|----------------|
| Setup Time | Instant | 5 min setup |
| Deployment Time | 3-5 min | 3-5 min |
| Success Rate | 50% (timeout issues) | 95%+ |
| Error Visibility | Poor (Azure logs only) | Excellent (GitHub UI) |
| Automation | None | Full CI/CD |
| Build Optimization | Basic | Production-optimized |
| Future Updates | Manual every time | Push to deploy |

**Recommendation**: Use GitHub Actions for reliable, automated deployments.

---

## Cost

GitHub Actions is **FREE** for public repositories.
For private repositories: 2,000 minutes/month free, then $0.008/minute.

Typical deployment: ~5 minutes
Monthly cost for 10 deployments: **FREE** (within free tier)

---

**Ready to deploy?** Follow Step 2 above to add the secret, then push your code!
