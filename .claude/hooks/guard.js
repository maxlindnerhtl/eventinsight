let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
    try {
        const ti = (JSON.parse(input).tool_input || {});
        const cmd = ti.command || '';
        const targets = [ti.command, ti.file_path, ti.path, ti.pattern, ti.glob]
            .filter(Boolean)
            .join(' ');

        if (/\bgit\b[^|;&\n]*\bpush\b/i.test(cmd)) {
            console.error('BLOCKIERT: git push ist gesperrt, der user pusht selbst');
            process.exit(2);
        }
        // .env as a path segment, delimited by whitespace, quotes, path or shell separators
        if (/(^|[\s/\\"'=;|&<>$()`*])\.env(\.(?!example\b)[\w.-]+)?($|[\s/\\"'=;|&<>$()`*])/i.test(targets)) {
            console.error('BLOCKIERT: .env darf nicht gelesen oder ausgegeben werden');
            process.exit(2);
        }
    } catch (e) {
        console.error('BLOCKIERT: guard.js konnte die Eingabe nicht prüfen: ' + e.message);
        process.exit(2);
    }
});