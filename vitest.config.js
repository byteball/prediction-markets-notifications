import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.js'],
        setupFiles: ['test/setup.js'],
        clearMocks: true,
        restoreMocks: true,
        server: {
            deps: {
                inline: true,
            },
        },
    },
});
