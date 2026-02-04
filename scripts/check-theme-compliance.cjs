const fs = require('fs');
const path = require('path');

const BANNED_PATTERNS = [
    /bg-white(?!\/)/, // Allow bg-white/10 etc if needed, but preferably not
    /bg-gray-\d+/,
    /bg-slate-\d+/,
    /bg-zinc-\d+/,
    /bg-neutral-\d+/,
    /bg-stone-\d+/,
    /text-gray-\d+/,
    /text-slate-\d+/,
    /text-zinc-\d+/,
    /text-neutral-\d+/,
    /text-stone-\d+/,
    /border-gray-\d+/,
    /border-slate-\d+/,
    /border-zinc-\d+/,
    /text-black/,
    /bg-black/,
];

const ALLOWED_FILES = []; // Add files to ignore if absolutely necessary

function scanDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                scanDirectory(filePath, fileList);
            }
        } else {
            if (/\.(tsx|jsx)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const srcDir = path.join(__dirname, '../src');
const files = scanDirectory(srcDir);
let errorCount = 0;

console.log('🔍 Scanning for hardcoded theme colors...');

files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    const lines = content.split('\n');
    lines.forEach((line, index) => {
        BANNED_PATTERNS.forEach(pattern => {
            if (pattern.test(line)) {
                console.log(`❌ ${relativePath}:${index + 1} - Found banned pattern: ${pattern}`);
                // console.log(`   Line: ${line.trim().substring(0, 100)}...`);
                errorCount++;
            }
        });
    });
});

if (errorCount > 0) {
    console.log(`\n⚠️ Found ${errorCount} potential hardcoded theme issues.`);
    console.log('Please replace these with semantic tokens (bg-card, text-foreground, etc.)');
    process.exit(1);
} else {
    console.log('\n✅ No hardcoded theme colors found! Great job.');
    process.exit(0);
}
