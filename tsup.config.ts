import { defineConfig } from 'tsup';

import fs from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react'],
  treeshake: true,
  minify: false,
  async onSuccess() {
    const files = ['dist/index.js', 'dist/index.mjs'];
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (!content.startsWith('"use client";')) {
          fs.writeFileSync(file, '"use client";\n' + content);
        }
      }
    }
  }
});
