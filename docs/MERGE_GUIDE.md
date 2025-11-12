# Branch Merge Guide

## Overview

This guide explains how to merge all feature branches from the 7 parallel agent worktrees into the main branch.

## Worktree Structure

```
polymarket-worktrees/
├── 01-infrastructure/     (feature/poly-infrastructure)
├── 02-database/          (feature/poly-database)
├── 03-backend-core/      (feature/poly-backend-core)
├── 04-backend-ai/        (feature/poly-backend-ai)
├── 05-frontend-scaffold/ (feature/poly-frontend-scaffold)
├── 06-frontend-ui/       (feature/poly-frontend-ui)
└── 07-deployment/        (feature/poly-deployment)
```

## Merge Order (Dependency-Based)

Branches must be merged in this order to respect dependencies:

1. **feature/poly-infrastructure** - Base infrastructure setup
2. **feature/poly-database** - Requires infrastructure
3. **feature/poly-backend-core** - Requires database
4. **feature/poly-backend-ai** - Requires backend-core
5. **feature/poly-frontend-scaffold** - Requires backend-core
6. **feature/poly-frontend-ui** - Requires frontend-scaffold
7. **feature/poly-deployment** - Requires all above

## Pre-Merge Checklist

### 1. Verify All Agents Completed Work

Check each worktree for completion:

```bash
for worktree in ~/polymarket-worktrees/*; do
    if [ -d "$worktree/.git" ]; then
        echo "=== $(basename $worktree) ==="
        cd "$worktree"
        git status
        git log --oneline -5
        echo ""
    fi
done
```

### 2. Run Conflict Detection

```bash
cd ~/polymarket-worktrees/07-deployment
python3 scripts/check-conflicts.py
```

Review `conflict-report.json` for potential issues.

### 3. Ensure Clean Working Trees

All worktrees should have no uncommitted changes:

```bash
for worktree in ~/polymarket-worktrees/*; do
    if [ -d "$worktree/.git" ]; then
        cd "$worktree"
        if ! git diff-index --quiet HEAD --; then
            echo "❌ $(basename $worktree) has uncommitted changes"
        else
            echo "✅ $(basename $worktree) is clean"
        fi
    fi
done
```

## Automated Merge

### Option 1: Automated Merge Script

```bash
cd ~/polymarket-worktrees/07-deployment
bash scripts/merge-all-branches.sh
```

This will:
- Merge branches in dependency order
- Check for conflicts before merging
- Run tests after each merge
- Rollback if tests fail
- Log all operations

### Option 2: Manual Merge

If automated merge encounters issues, follow manual steps:

## Manual Merge Process

### Step 1: Merge Infrastructure

```bash
cd ~/polymarket-worktrees/07-deployment
git checkout feature/polymarket-web-app
git pull origin feature/polymarket-web-app

git merge --no-ff feature/poly-infrastructure \
  -m "Merge feature/poly-infrastructure: Azure infrastructure setup"

# If conflicts:
git status  # See conflicted files
# Resolve conflicts manually
git add .
git commit
```

### Step 2: Merge Database

```bash
git merge --no-ff feature/poly-database \
  -m "Merge feature/poly-database: PostgreSQL schema and migrations"

# Test database migrations
bash scripts/deploy-database.sh
```

### Step 3: Merge Backend Core

```bash
git merge --no-ff feature/poly-backend-core \
  -m "Merge feature/poly-backend-core: Core API endpoints"

# Test backend
cd backend && pytest
```

### Step 4: Merge Backend AI

```bash
git merge --no-ff feature/poly-backend-ai \
  -m "Merge feature/poly-backend-ai: AI analysis features"

# Test AI features
cd backend && pytest tests/test_ai.py
```

### Step 5: Merge Frontend Scaffold

```bash
git merge --no-ff feature/poly-frontend-scaffold \
  -m "Merge feature/poly-frontend-scaffold: Frontend foundation"

# Test frontend build
cd frontend && npm run build
```

### Step 6: Merge Frontend UI

```bash
git merge --no-ff feature/poly-frontend-ui \
  -m "Merge feature/poly-frontend-ui: Complete UI components"

# Test frontend
cd frontend && npm test
```

### Step 7: Merge Deployment

```bash
git merge --no-ff feature/poly-deployment \
  -m "Merge feature/poly-deployment: Deployment orchestration"

# Run full deployment test
bash deploy-all.sh
```

## Conflict Resolution

### Common Conflict Types

1. **Package Dependencies**
   - File: `package.json`, `requirements.txt`
   - Resolution: Keep both dependencies, merge manually

2. **Configuration Files**
   - Files: `.env.example`, `config.py`
   - Resolution: Merge configurations, keep all settings

3. **Database Migrations**
   - Files: `migrations/*.sql`
   - Resolution: Rename conflicting migrations with different timestamps

4. **API Endpoints**
   - Files: `routes/*.py`, `api/*.ts`
   - Resolution: Keep both endpoints, ensure unique paths

### Conflict Resolution Strategy

```bash
# When conflict occurs:
git status  # View conflicted files

# For each conflicted file:
git diff <file>  # See conflict markers

# Edit file to resolve:
# <<<<<<< HEAD
# Current branch changes
# =======
# Incoming branch changes
# >>>>>>> feature-branch

# After resolving:
git add <file>

# Verify no conflicts remain:
git status

# Complete merge:
git commit
```

### Testing After Merge

After each merge:

```bash
# 1. Run unit tests
cd backend && pytest
cd frontend && npm test

# 2. Run integration tests
bash integration-tests/test-api-flow.sh

# 3. Run health checks
bash scripts/health-check-all.sh
```

## Post-Merge Validation

### 1. Verify All Branches Merged

```bash
git log --oneline --graph --all
```

Should show all feature branches merged into main.

### 2. Check All Components

```bash
# Database
psql "$CONNECTION_STRING" -c "\dt"

# Backend
curl https://polymarket-analyzer.azurewebsites.net/api/health

# Frontend
curl https://polymarket-web-ui.azurewebsites.net
```

### 3. Run Full Deployment

```bash
bash deploy-all.sh
```

### 4. Run Complete Test Suite

```bash
# All tests
bash scripts/health-check-all.sh
bash integration-tests/test-api-flow.sh
bash integration-tests/test-ui-flow.sh
```

## Troubleshooting

### Merge Conflicts

**Problem:** Merge conflict in multiple files

**Solution:**
```bash
# Abort current merge
git merge --abort

# Identify problematic branch
python3 scripts/check-conflicts.py

# Merge with strategy
git merge -X ours feature-branch  # Prefer current branch
# or
git merge -X theirs feature-branch  # Prefer incoming branch
```

### Test Failures After Merge

**Problem:** Tests fail after successful merge

**Solution:**
```bash
# Rollback merge
git reset --hard HEAD~1

# Investigate test failures
pytest -v  # Backend
npm test -- --verbose  # Frontend

# Fix issues in feature branch
git checkout feature-branch
# Fix issues
git commit -am "fix: test failures"

# Retry merge
git checkout feature/polymarket-web-app
git merge feature-branch
```

### Database Migration Conflicts

**Problem:** Multiple migrations with same timestamp

**Solution:**
```bash
# List migrations
ls -la migrations/

# Rename conflicting migrations
mv migrations/001_schema.sql migrations/001_base_schema.sql
mv migrations/001_tables.sql migrations/002_additional_tables.sql

# Update references
git add migrations/
git commit -m "fix: resolve migration conflicts"
```

## Best Practices

1. **Merge during low-traffic hours**
2. **Create backup branch** before merging:
   ```bash
   git branch backup-$(date +%Y%m%d)
   ```
3. **Test thoroughly** after each merge
4. **Keep merge commits** for history:
   ```bash
   git merge --no-ff  # Always create merge commit
   ```
5. **Document conflicts** and resolutions
6. **Communicate** with team about merge progress

## Rollback Plan

If merge causes critical issues:

```bash
# 1. Stop services
bash scripts/rollback.sh

# 2. Revert to pre-merge state
git log --oneline -20  # Find pre-merge commit
git reset --hard <commit-hash>

# 3. Force push (only if not in production!)
git push origin feature/polymarket-web-app --force

# 4. Investigate and fix
git checkout feature-branch
# Fix issues
git push origin feature-branch

# 5. Retry merge
git checkout feature/polymarket-web-app
bash scripts/merge-all-branches.sh
```

## Alternative: Squash Merge

For cleaner history, consider squash merging:

```bash
git merge --squash feature-branch
git commit -m "feat: add feature from branch

- Detailed list of changes
- Another change
"
```

**Pros:**
- Clean linear history
- Single commit per feature

**Cons:**
- Loses individual commit history
- Harder to revert specific changes

## GitHub Pull Request Merge

If using GitHub:

1. **Create PR** for each branch
2. **Review changes** with team
3. **Run CI/CD** tests automatically
4. **Merge via GitHub** UI with "Create merge commit"
5. **Pull locally**:
   ```bash
   git checkout feature/polymarket-web-app
   git pull origin feature/polymarket-web-app
   ```

## Verification Report

After all merges complete:

```bash
# Generate report
cat > merge-report.md << 'EOF'
# Merge Completion Report

## Merged Branches
- [x] feature/poly-infrastructure
- [x] feature/poly-database
- [x] feature/poly-backend-core
- [x] feature/poly-backend-ai
- [x] feature/poly-frontend-scaffold
- [x] feature/poly-frontend-ui
- [x] feature/poly-deployment

## Tests Status
- [x] Unit tests passing
- [x] Integration tests passing
- [x] Health checks passing

## Deployment Status
- [x] Database deployed
- [x] Backend deployed
- [x] Frontend deployed

## Conflicts Resolved
(List any conflicts and how they were resolved)

## Next Steps
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Update documentation
- [ ] Clean up feature branches
EOF
```

## Cleanup

After successful merge and deployment:

```bash
# Delete remote feature branches
git push origin --delete feature/poly-infrastructure
git push origin --delete feature/poly-database
# ... etc

# Delete local branches
git branch -d feature/poly-infrastructure
git branch -d feature/poly-database
# ... etc

# Remove worktrees
git worktree remove ~/polymarket-worktrees/01-infrastructure
git worktree remove ~/polymarket-worktrees/02-database
# ... etc
```

## Support

For merge issues:
- Review `merge.log` in deployment worktree
- Check `conflict-report.json`
- Contact agent leads for specific worktree issues
- Escalate to senior developer if stuck
