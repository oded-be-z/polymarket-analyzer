#!/usr/bin/env python3
"""
Predictive Conflict Detection Script
Analyzes all feature branches and identifies potential merge conflicts
"""

import subprocess
import sys
from pathlib import Path
from collections import defaultdict
import json

WORKTREE_BASE = Path.home() / "polymarket-worktrees"
MAIN_BRANCH = "feature/polymarket-web-app"

# Merge order based on dependencies
MERGE_ORDER = [
    ("01-infrastructure", "feature/poly-infrastructure"),
    ("02-database", "feature/poly-database"),
    ("03-backend-core", "feature/poly-backend-core"),
    ("04-backend-ai", "feature/poly-backend-ai"),
    ("05-frontend-scaffold", "feature/poly-frontend-scaffold"),
    ("06-frontend-ui", "feature/poly-frontend-ui"),
    ("07-deployment", "feature/poly-deployment"),
]

def run_command(cmd, cwd=None):
    """Execute shell command and return output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return None

def get_changed_files(worktree_path, branch_name):
    """Get list of files changed in a branch compared to main"""
    cmd = f"git diff --name-only {MAIN_BRANCH}...{branch_name}"
    output = run_command(cmd, cwd=worktree_path)
    if output:
        return set(output.split('\n'))
    return set()

def check_merge_conflicts(base_branch, target_branch, worktree_path):
    """Simulate merge and check for conflicts"""
    # Create temporary branch for testing
    test_branch = f"test-merge-{target_branch.split('/')[-1]}"

    commands = [
        f"git checkout {base_branch}",
        f"git checkout -b {test_branch}",
        f"git merge --no-commit --no-ff {target_branch}"
    ]

    for cmd in commands:
        result = run_command(cmd, cwd=worktree_path)
        if result is None and "merge" in cmd:
            # Merge conflict detected
            conflicted_files = run_command(
                "git diff --name-only --diff-filter=U",
                cwd=worktree_path
            )
            # Abort merge and cleanup
            run_command("git merge --abort", cwd=worktree_path)
            run_command(f"git checkout {base_branch}", cwd=worktree_path)
            run_command(f"git branch -D {test_branch}", cwd=worktree_path)

            if conflicted_files:
                return conflicted_files.split('\n')
            return ["Unknown conflict"]

    # No conflicts, cleanup
    run_command("git merge --abort || true", cwd=worktree_path)
    run_command(f"git checkout {base_branch}", cwd=worktree_path)
    run_command(f"git branch -D {test_branch}", cwd=worktree_path)
    return []

def analyze_file_overlaps():
    """Analyze which branches modify the same files"""
    file_modifications = defaultdict(list)

    print("=" * 80)
    print("CONFLICT DETECTION ANALYSIS")
    print("=" * 80)
    print()

    # Collect file changes from each branch
    for worktree_name, branch_name in MERGE_ORDER:
        worktree_path = WORKTREE_BASE / worktree_name
        if not worktree_path.exists():
            print(f"⚠️  Worktree not found: {worktree_path}")
            continue

        changed_files = get_changed_files(worktree_path, branch_name)
        print(f"📁 {branch_name}: {len(changed_files)} files changed")

        for file in changed_files:
            file_modifications[file].append(branch_name)

    print()
    print("=" * 80)
    print("OVERLAPPING FILE MODIFICATIONS")
    print("=" * 80)
    print()

    conflicts_found = False
    potential_conflicts = []

    for file, branches in sorted(file_modifications.items()):
        if len(branches) > 1:
            conflicts_found = True
            print(f"⚠️  {file}")
            print(f"   Modified by: {', '.join(branches)}")
            print()
            potential_conflicts.append({
                "file": file,
                "branches": branches
            })

    if not conflicts_found:
        print("✅ No overlapping file modifications detected")

    print()
    print("=" * 80)
    print("SIMULATED MERGE CONFLICTS")
    print("=" * 80)
    print()

    # Simulate merges in order
    deployment_path = WORKTREE_BASE / "07-deployment"
    current_base = MAIN_BRANCH
    merge_conflicts = []

    for worktree_name, branch_name in MERGE_ORDER:
        print(f"🔄 Simulating merge: {branch_name} → {current_base}")

        conflicts = check_merge_conflicts(current_base, branch_name, deployment_path)

        if conflicts:
            print(f"   ❌ CONFLICTS DETECTED:")
            for conflict in conflicts:
                print(f"      - {conflict}")
            merge_conflicts.append({
                "source": branch_name,
                "target": current_base,
                "conflicts": conflicts
            })
        else:
            print(f"   ✅ No conflicts")
        print()

    # Generate report
    report = {
        "timestamp": subprocess.run(
            ["date", "+%Y-%m-%d %H:%M:%S"],
            capture_output=True,
            text=True
        ).stdout.strip(),
        "potential_conflicts": potential_conflicts,
        "merge_conflicts": merge_conflicts,
        "total_potential_conflicts": len(potential_conflicts),
        "total_merge_conflicts": len(merge_conflicts)
    }

    # Save report
    with open(deployment_path / "conflict-report.json", "w") as f:
        json.dump(report, f, indent=2)

    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Potential file conflicts: {len(potential_conflicts)}")
    print(f"Confirmed merge conflicts: {len(merge_conflicts)}")
    print()
    print(f"Report saved to: conflict-report.json")
    print("=" * 80)

    return len(merge_conflicts) == 0

if __name__ == "__main__":
    success = analyze_file_overlaps()
    sys.exit(0 if success else 1)
