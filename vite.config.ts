import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { themeCss } from './src/theme/tokens.ts';

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

// Insère les jetons de src/theme/tokens.ts dans src/index.css, avant Tailwind.
function jetons(): Plugin {
  return {
    name: 'jetons',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/index.css')) return;
      this.addWatchFile(new URL('./src/theme/tokens.ts', import.meta.url).pathname);
      return code.replace('/* @jetons */', themeCss());
    },
  };
}

export default defineConfig({
  plugins: [jetons(), tailwindcss(), react(), versionTxt()],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  // Le worker de MapLibre (src/map/maplibre.ts) contient des imports : format module.
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    passWithNoTests: true,
  },
});
