const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: true,
        sourcemap: true,
        platform: 'node',
        target: 'node18',
        outfile: 'dist/extension.js',
        // `vscode` is provided by the VS Code runtime and must never be bundled.
        // `open` ships helper assets (e.g. an xdg-open script) that it resolves
        // via a runtime path relative to its own module location; bundling it
        // breaks that resolution, so it must stay external and ship via
        // node_modules.
        external: ['vscode', 'open'],
        logLevel: 'info',
    });
    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
