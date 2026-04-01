// Location: /root/gth_launch.js
const { execSync } = require('child_process');
const fs = require('fs');

async function launchGTHPro() {
    console.log("🚀 GTH-PRO: Initiating 9-Point Supreme Launch...");

    try {
        // STEP 1: Generate 12,000 Cities Data
        console.log("📡 Step 1: Generating Master JSON (12,000 Cities)...");
        execSync('python backend/gth_master_scraper.py', { stdio: 'inherit' });

        // STEP 2: Universal Image Optimization (Point 2 & 9)
        console.log("🖼️ Step 2: Optimizing Images (WebP & Mobile Refactor)...");
        execSync('node gth_optimus.js', { stdio: 'inherit' });

        // STEP 3: Bulk Database Sync (Point 4 & 8)
        console.log("🗄️ Step 3: Syncing with Supabase (Zero Leakage Mode)...");
        execSync('python backend/gth_sync.py', { stdio: 'inherit' });

        // STEP 4: Production Build (Security & UI Activation)
        console.log("🏗️ Step 4: Finalizing Next.js Production Build...");
        execSync('npm run build', { stdio: 'inherit' });

        console.log("✨ GTH-PRO IS LIVE! Market Halchal Initiated. 10k Traffic Ready.");
    } catch (error) {
        console.error("❌ Launch Failed! Check Logs:", error.message);
    }
}

launchGTHPro();