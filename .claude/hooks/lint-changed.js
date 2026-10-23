const { execSync } = require('child_process');
const path = require('path');
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
    if (JSON.parse(input || '{}').stop_hook_active) process.exit(0);
    const root = process.env.CLAUDE_PROJECT_DIR;
    // Added/modified tracked files plus untracked ones; --no-renames lists a rename target as added
    const git = cmd => execSync(cmd, { cwd: root, encoding: 'utf8' }).split('\n');
    const files = [
        ...git('git diff --name-only --no-renames --diff-filter=AM HEAD'),
        ...git('git ls-files --others --exclude-standard'),
    ]
        .map(f => f.trim())
        .filter(f => /\.(jsx?|mjs|cjs)$/.test(f) && !/node_modules|(^|\/)build\//.test(f));
    if (!files.length) process.exit(0);
    try {
        // Run from the frontend folder so the locally installed oxlint is used
        execSync(`npx oxlint ${files.map(f => `"${path.join(root, f)}"`).join(' ')}`, {
            cwd: path.join(root, 'software', 'event-insight'), encoding: 'utf8', stdio: 'pipe',
        });
    } catch (e) {
        console.error((e.stdout || '') + (e.stderr || ''));
        process.exit(2);
    }
});
