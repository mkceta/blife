/**
 * Script to update all Supabase imports to use the new consolidated structure
 * Run with: node scripts/update-supabase-imports.js
 */

const fs = require('fs');
const path = require('path');

const replacements = [
    {
        from: "from '@/lib/supabase'",
        to: "from '@/lib/supabase/client'",
        description: 'Client imports'
    },
    {
        from: "from '@/lib/supabase-server'",
        to: "from '@/lib/supabase/server'",
        description: 'Server imports'
    },
    {
        from: "from '@/lib/supabase-admin'",
        to: "from '@/lib/supabase/admin'",
        description: 'Admin imports'
    }
];

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    replacements.forEach(({ from, to }) => {
        if (content.includes(from)) {
            content = content.replaceAll(from, to);
            changed = true;
        }
    });

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
            // Skip node_modules, .next, .git
            if (!['node_modules', '.next', '.git', 'android', 'out'].includes(entry.name)) {
                walkDir(fullPath, callback);
            }
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            callback(fullPath);
        }
    }
}

console.log('🔄 Updating Supabase imports...\n');

let filesUpdated = 0;
const rootDir = path.join(__dirname, '..');

walkDir(rootDir, (filePath) => {
    if (updateFile(filePath)) {
        filesUpdated++;
        console.log(`✅ Updated: ${path.relative(rootDir, filePath)}`);
    }
});

console.log(`\n✨ Done! Updated ${filesUpdated} files.`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes with git diff');
console.log('2. Test that the app still compiles');
console.log('3. Delete old files: lib/supabase.ts, lib/supabase-server.ts, lib/supabase-admin.ts');
