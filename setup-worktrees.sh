#!/bin/bash
set -e

WORKTREE_BASE="$HOME/polymarket-worktrees"
MAIN_REPO="$HOME/polymarket-analyzer"

echo "🌳 Setting up 7 parallel git worktrees..."
echo "================================================"

# Create worktree directory
mkdir -p "$WORKTREE_BASE"

# Array of branches
declare -a BRANCHES=(
    "infrastructure:Azure resources, Function App, Key Vault"
    "database:PostgreSQL schema, migrations, seed data"
    "backend-core:Markets API, Price API, Polymarket integration"
    "backend-ai:Sentiment API, Analysis API, GPT-5-Pro integration"
    "frontend-scaffold:Next.js setup, routing, layout, design system"
    "frontend-ui:React components, charts, forms, interactions"
    "deployment:CI/CD, deployment scripts, health checks"
)

counter=1
for branch_info in "${BRANCHES[@]}"; do
    branch_name="${branch_info%%:*}"
    purpose="${branch_info#*:}"
    
    branch_full="feature/poly-$branch_name"
    worktree_dir="$WORKTREE_BASE/$(printf "%02d" $counter)-$branch_name"
    
    echo ""
    echo "📁 Creating worktree $counter/7:"
    echo "   Directory: $worktree_dir"
    echo "   Branch: $branch_full"
    echo "   Purpose: $purpose"
    
    # Create worktree
    cd "$MAIN_REPO"
    git worktree add -b "$branch_full" "$worktree_dir" 2>&1
    
    # Initialize structure
    cd "$worktree_dir"
    
    # Create README
    cat > README.md <<EOF
# $branch_full

**Purpose**: $purpose

**Agent**: Agent-$(echo $branch_name | tr '[:lower:]' '[:upper:]')

**Status**: Initialized at $(date)

## Next Steps

This worktree is ready for parallel development.
Each agent will work independently in its isolated workspace.
EOF
    
    # Initial commit
    git add README.md
    git commit -m "feat: Initialize $branch_name worktree" \
        -m "Purpose: $purpose" \
        -m "Created: $(date)" \
        --no-verify
    
    echo "✅ Worktree $counter/7 created successfully"
    
    counter=$((counter + 1))
done

echo ""
echo "================================================"
echo "✅ All 7 worktrees created successfully!"
echo "================================================"
echo ""
echo "📊 Worktree Status:"
cd "$MAIN_REPO"
git worktree list

echo ""
echo "🔍 Validating worktrees..."
validation_failed=0

counter=1
for branch_info in "${BRANCHES[@]}"; do
    branch_name="${branch_info%%:*}"
    worktree_dir="$WORKTREE_BASE/$(printf "%02d" $counter)-$branch_name"
    
    if [ -d "$worktree_dir/.git" ]; then
        echo "✅ $branch_name: Valid git worktree"
    else
        echo "❌ $branch_name: FAILED - Not a valid worktree"
        validation_failed=1
    fi
    counter=$((counter + 1))
done

if [ $validation_failed -eq 1 ]; then
    echo ""
    echo "❌ Worktree validation failed"
    exit 1
fi

echo ""
echo "✅ All worktrees validated successfully!"
echo ""
echo "🎯 Next: Store secrets in Azure Key Vault and launch 7 parallel agents"
