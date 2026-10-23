const { execSync } = require('child_process');
const path = require('path');
let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
    const root = process.env.CLAUDE_PROJECT_DIR;
    const file = (JSON.parse(input).tool_input || {}).file_path || '';
    if (!/\.(jsx?|mjs|cjs)$/.test(file) || /node_modules|[\\/]build[\\/]/.test(file)) process.exit(0);
    try {
        // Run from the frontend folder so the locally installed oxlint is used
        execSync(`npx oxlint "${path.resolve(root, file)}"`, {
            cwd: path.join(root, 'software', 'event-insight'),
            encoding: 'utf8',
            stdio: 'pipe',
        });
    } catch (e) {
        console.error((e.stdout || '') + (e.stderr || ''));
        process.exit(2);
    }
});