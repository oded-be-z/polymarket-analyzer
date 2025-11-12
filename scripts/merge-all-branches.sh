#!/bin/bash
# Branch Merge Orchestrator
# Automated merge with conflict detection and testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

WORKTREE_BASE="$HOME/polymarket-worktrees"
MAIN_BRANCH="feature/polymarket-web-app"
LOG_FILE="$WORKTREE_BASE/07-deployment/merge.log"

# Merge order (based on dependencies)
declare -a MERGE_ORDER=(
    "01-infrastructure:feature/poly-infrastructure"
    "02-database:feature/poly-database"
    "03-backend-core:feature/poly-backend-core"
    "04-backend-ai:feature/poly-backend-ai"
    "05-frontend-scaffold:feature/poly-frontend-scaffold"
    "06-frontend-ui:feature/poly-frontend-ui"
    "07-deployment:feature/poly-deployment"
)

echo "================================================================================" | tee -a "$LOG_FILE"
echo "BRANCH MERGE ORCHESTRATOR" | tee -a "$LOG_FILE"
echo "================================================================================" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Function to log messages
log() {
    echo -e "${2:-$NC}$1${NC}" | tee -a "$LOG_FILE"
}

# Function to check if branch exists
branch_exists() {
    local branch=$1
    git rev-parse --verify "$branch" >/dev/null 2>&1
}

# Function to check for uncommitted changes
check_clean_working_tree() {
    if ! git diff-index --quiet HEAD --; then
        log "❌ Working tree has uncommitted changes. Please commit or stash them." "$RED"
        return 1
    fi
    return 0
}

# Function to run tests
run_tests() {
    local worktree_name=$1
    local test_script="$WORKTREE_BASE/$worktree_name/test.sh"

    if [ -f "$test_script" ]; then
        log "   Running tests..." "$BLUE"
        if bash "$test_script" >> "$LOG_FILE" 2>&1; then
            log "   ✅ Tests passed" "$GREEN"
            return 0
        else
            log "   ❌ Tests failed" "$RED"
            return 1
        fi
    else
        log "   ⚠️  No test script found, skipping tests" "$YELLOW"
        return 0
    fi
}

# Function to merge a single branch
merge_branch() {
    local worktree_name=$1
    local branch_name=$2

    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"
    log "Merging: $branch_name" "$BLUE"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"

    # Check if branch exists
    if ! branch_exists "$branch_name"; then
        log "❌ Branch $branch_name does not exist, skipping" "$RED"
        return 1
    fi

    # Fetch latest changes
    log "   Fetching latest changes..." "$BLUE"
    git fetch origin "$branch_name" >> "$LOG_FILE" 2>&1

    # Check for conflicts before merging
    log "   Checking for conflicts..." "$BLUE"
    if git merge --no-commit --no-ff "$branch_name" >> "$LOG_FILE" 2>&1; then
        # No conflicts, check if there are changes
        if git diff --cached --quiet; then
            log "   ℹ️  No changes to merge (already up to date)" "$YELLOW"
            git merge --abort 2>/dev/null || true
            return 0
        fi

        # Abort the test merge
        git merge --abort 2>/dev/null || true

        # Perform actual merge
        log "   No conflicts detected, performing merge..." "$GREEN"
        if git merge --no-ff -m "Merge $branch_name into $MAIN_BRANCH

Automated merge by deployment orchestrator
Worktree: $worktree_name
Date: $(date)" "$branch_name" >> "$LOG_FILE" 2>&1; then

            log "   ✅ Merge successful" "$GREEN"

            # Run tests
            if ! run_tests "$worktree_name"; then
                log "   ⚠️  Tests failed after merge, considering rollback..." "$YELLOW"
                log "   Rolling back merge..." "$YELLOW"
                git reset --hard HEAD~1 >> "$LOG_FILE" 2>&1
                log "   ❌ Merge rolled back due to test failures" "$RED"
                return 1
            fi

            return 0
        else
            log "   ❌ Merge failed unexpectedly" "$RED"
            return 1
        fi
    else
        # Conflicts detected
        log "   ❌ CONFLICTS DETECTED" "$RED"
        log "   Conflicted files:" "$RED"
        git diff --name-only --diff-filter=U | tee -a "$LOG_FILE"

        # Abort merge
        git merge --abort 2>/dev/null || true

        log "   ⚠️  Manual intervention required" "$YELLOW"
        log "   To resolve manually:" "$YELLOW"
        log "      1. git checkout $MAIN_BRANCH" "$YELLOW"
        log "      2. git merge $branch_name" "$YELLOW"
        log "      3. Resolve conflicts" "$YELLOW"
        log "      4. git add ." "$YELLOW"
        log "      5. git commit" "$YELLOW"

        return 1
    fi
}

# Main execution
main() {
    cd "$WORKTREE_BASE/07-deployment"

    # Checkout main branch
    log "Checking out $MAIN_BRANCH..." "$BLUE"
    git checkout "$MAIN_BRANCH" >> "$LOG_FILE" 2>&1

    # Check for clean working tree
    if ! check_clean_working_tree; then
        exit 1
    fi

    # Pull latest changes
    log "Pulling latest changes from origin..." "$BLUE"
    git pull origin "$MAIN_BRANCH" >> "$LOG_FILE" 2>&1 || true

    log "" ""

    # Track results
    declare -a SUCCESSFUL_MERGES=()
    declare -a FAILED_MERGES=()
    declare -a SKIPPED_MERGES=()

    # Merge branches in order
    for item in "${MERGE_ORDER[@]}"; do
        IFS=':' read -r worktree_name branch_name <<< "$item"

        if merge_branch "$worktree_name" "$branch_name"; then
            SUCCESSFUL_MERGES+=("$branch_name")
        else
            FAILED_MERGES+=("$branch_name")
        fi

        log "" ""
    done

    # Summary
    log "================================================================================" "$BLUE"
    log "MERGE SUMMARY" "$BLUE"
    log "================================================================================" "$BLUE"
    log "Successful: ${#SUCCESSFUL_MERGES[@]}" "$GREEN"
    for branch in "${SUCCESSFUL_MERGES[@]}"; do
        log "   ✅ $branch" "$GREEN"
    done
    log "" ""

    log "Failed: ${#FAILED_MERGES[@]}" "$RED"
    for branch in "${FAILED_MERGES[@]}"; do
        log "   ❌ $branch" "$RED"
    done
    log "" ""

    log "Completed: $(date)" "$BLUE"
    log "Log file: $LOG_FILE" "$BLUE"
    log "================================================================================" "$BLUE"

    # Exit with error if any merges failed
    if [ ${#FAILED_MERGES[@]} -gt 0 ]; then
        exit 1
    fi

    exit 0
}

main "$@"
