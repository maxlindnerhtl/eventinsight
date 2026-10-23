const { execSync } = require('child_process');
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
    const file = (JSON.parse(input).tool_input || {}).file_path || '';
    if (!/\.(jsx?|mjs|cjs)$/.test(file) || /node_modules|[\\/]build[\\/]/.test(file)) process.exit(0);
    try {
        execSync(`npx oxlint "${file}"`, {
            cwd: process.env.CLAUDE_PROJECT_DIR,
            encoding: 'utf8',
            stdio: 'pipe',
        });
    } catch (e) {
        console.error((e.stdout || '') + (e.stderr || ''));
        process.exit(2);
    }
});