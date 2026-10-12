import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Repère de version : /version.txt contient le hash du commit construit.
function versionTxt(): Plugin {
  return {
    name: 'version-txt',
    apply: 'build',
    generateBundle() {
      const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      this.emitFile({ type: 'asset', fileName: 'version.txt', source: `${hash}\n` });
    },
  };
}

export default defineConfig({
  plugins: [react(), versionTxt()],
  // Le worker de MapLibre (src/map/maplibre.ts) contient des imports : format module.
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    passWithNoTests: true,
  },
});
