#!/bin/bash
set -e

LOG="/opt/examel/logs/deploy.log"
PAGES_DIR="/opt/examel/examel-pages"
PDF_DIR="/opt/examel/pdf-engine"

echo "═══════════════════════════════════════" | tee -a $LOG
echo "DEPLOY: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a $LOG
echo "═══════════════════════════════════════" | tee -a $LOG

# Step 1: Config tests
echo "▶ Step 1: Config tests..." | tee -a $LOG
cd $PAGES_DIR
node examel-config/test.js >> $LOG 2>&1
if [ $? -ne 0 ]; then
  echo "🔴 BLOCKED: Config tests failed" | tee -a $LOG
  exit 1
fi
echo "✅ Config tests passed" | tee -a $LOG

# Step 2: Generate pages
echo "▶ Step 2: Generating pages..." | tee -a $LOG
node generate-pages.js >> $LOG 2>&1
if [ $? -ne 0 ]; then
  echo "🔴 BLOCKED: generate-pages.js failed" | tee -a $LOG
  exit 1
fi
echo "✅ Pages generated" | tee -a $LOG

# Step 3: Generate homepage
echo "▶ Step 3: Generating homepage..." | tee -a $LOG
node generate-homepage.js >> $LOG 2>&1
if [ $? -ne 0 ]; then
  echo "🔴 BLOCKED: generate-homepage.js failed" | tee -a $LOG
  exit 1
fi
echo "✅ Homepage generated" | tee -a $LOG

# Step 3b: Post-build inject (schema/OG for hub pages)
echo "▶ Step 3b: Post-build inject..." | tee -a $LOG
node $PAGES_DIR/post-build-inject.js >> $LOG 2>&1 || { echo "🔴 BLOCKED: post-build-inject.js failed" | tee -a $LOG; exit 1; }
echo "✅ Post-build inject done" | tee -a $LOG

# Step 4: Health monitor — block on criticals
echo "▶ Step 4: Health check..." | tee -a $LOG
HEALTH=$(node $PDF_DIR/seo/site-health-monitor.js --post-build 2>&1)
echo "$HEALTH" >> $LOG
if echo "$HEALTH" | grep -q "🔴 CRITICAL"; then
  echo "🔴 BLOCKED: Critical health issues found — see log" | tee -a $LOG
  echo "$HEALTH" | grep "🔴 CRITICAL" | tee -a $LOG
  exit 1
fi
echo "✅ Health check passed" | tee -a $LOG

# Step 5: Git push
echo "▶ Step 5: Pushing to GitHub..." | tee -a $LOG
cd $PAGES_DIR
git add -A >> $LOG 2>&1
git diff --cached --quiet && echo "⚠️  Nothing to commit" | tee -a $LOG || git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M')" >> $LOG 2>&1
git push >> $LOG 2>&1
if [ $? -ne 0 ]; then
  echo "🔴 BLOCKED: Git push failed" | tee -a $LOG
  exit 1
fi
echo "✅ Pushed to GitHub" | tee -a $LOG

echo "🚀 DEPLOY COMPLETE: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a $LOG
