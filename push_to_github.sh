#!/bin/bash
# ==============================================================================
# Helper Script to Push FoundIt to your GitHub Repository
# ==============================================================================
# Usage:
#   chmod +x push_to_github.sh
#   ./push_to_github.sh <YOUR_GITHUB_USERNAME>
# Example:
#   ./push_to_github.sh soukaryochandra
# ==============================================================================

if [ -z "$1" ]; then
  echo "Usage: ./push_to_github.sh <YOUR_GITHUB_USERNAME> [REPO_NAME]"
  echo "Example: ./push_to_github.sh soukaryochandra FoundIt"
  exit 1
fi

GITHUB_USER="$1"
REPO_NAME="${2:-FoundIt}"
REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo "Configuring remote: ${REMOTE_URL}"
git remote remove origin 2>/dev/null || true
git remote add origin "${REMOTE_URL}"
git branch -M main

echo "Pushing code to ${REMOTE_URL} (branch: main)..."
git push -u origin main

echo "Done! Repository published at: https://github.com/${GITHUB_USER}/${REPO_NAME}"
