import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ base: '/SFU-Peer-Mentor-Hub/', plugins: [react()], test: { environment: 'jsdom', setupFiles: './src/tests/setup.ts', include: ['src/**/*.test.{ts,tsx}'] } });
