/**
 * Script to fix server action imports to use createServerClient
 * Run with: node scripts/fix-server-imports.js
 */

const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Only update files that import from server.ts
    if (content.includes("from '@/lib/supabase/server'")) {
        // Replace createClient with createServerClient in the import
        if (content.includes("import { createClient } from '@/lib/supabase/server'")) {
            content = content.replace(
                "import { createClient } from '@/lib/supabase/server'",
                "import { createServerClient } from '@/lib/supabase/server'"
            );

            // Also update usages of createClient to createServerClient
            // But only if it's being called (to avoid renaming unrelated createClient calls)
            content = content.replace(/const supabase = await createClient\(\)/g, 'const supabase = await createServerClient()');
            content = content.replace(/createClient\(\)/g, 'createServerClient()');

            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

function walkDir(dir, callback) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!['node_modules', '.next', '.git', 'android', 'out'].includes(entry.name)) {
                walkDir(fullPath, callback);
            }
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            callback(fullPath);
        }
    }
}

console.log('🔄 Fixing server action imports...\n');

let filesUpdated = 0;
const rootDir = path.join(__dirname, '..');

walkDir(rootDir, (filePath) => {
    if (updateFile(filePath)) {
        filesUpdated++;
        console.log(`✅ Updated: ${path.relative(rootDir, filePath)}`);
    }
});

console.log(`\n✨ Done! Updated ${filesUpdated} files.`);
