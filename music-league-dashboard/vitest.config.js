import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [], // Add setup files if needed
        include: ['**/*.test.{js,jsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
});
