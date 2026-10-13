#!/bin/sh
# Builds the site into .check/<name> while holding a lock, so several people (or agents)
# can validate their work in parallel without clobbering each other's builds.
# Usage: scripts/check.sh <name>
name=${1:-local}
cd "$(dirname "$0")/.." || exit 1
mkdir -p .check
while ! mkdir .check/.lock 2>/dev/null; do
  # Break a stale lock older than 5 minutes.
  if [ $(( $(date +%s) - $(stat -f %m .check/.lock 2>/dev/null || date +%s) )) -gt 300 ]; then rmdir .check/.lock 2>/dev/null; fi
  sleep 1
done
trap 'rmdir .check/.lock 2>/dev/null' EXIT INT TERM
log=".check/$name.log"
if npx astro build --outDir ".check/$name" >"$log" 2>&1; then
  grep -E "page\(s\) built" "$log"
  grep -iE "\[WARN\]" "$log" | grep -v 'collection "components"' | sort -u | head -20
  echo "OK: built into .check/$name"
else
  echo "BUILD FAILED. Last lines of $log:"
  tail -40 "$log"
  exit 1
fi
