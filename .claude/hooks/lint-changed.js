const { execSync } = require('child_process');
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
    if (JSON.parse(input || '{}').stop_hook_active) process.exit(0);
    const cwd = process.env.CLAUDE_PROJECT_DIR;
    const files = execSync('git status --porcelain', { cwd, encoding: 'utf8' })
        .split('\n')
        .map(l => l.slice(3).trim().replace(/"/g, ''))
        .filter(f => /\.(jsx?|mjs|cjs)$/.test(f) && !/node_modules|(^|\/)build\//.test(f));
    if (!files.length) process.exit(0);
    try {
        execSync(`npx oxlint ${files.map(f => `"${f}"`).join(' ')}`, {
            cwd, encoding: 'utf8', stdio: 'pipe',
        });
    } catch (e) {
        console.error((e.stdout || '') + (e.stderr || ''));
        process.exit(2);
    }
});