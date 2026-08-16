import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'test/**/*.test.js',
    mocha: {
        // The existing tests use Mocha's TDD interface (suite/test).
        ui: 'tdd',
    },
});
