/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { iwsdkDev } from '@iwsdk/vite-plugin-dev';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [iwsdkDev()],
  // Each app in this workspace owns a fixed port; strictPort surfaces
  // collisions loudly instead of silently drifting (vr-app uses 8091).
  server: { host: '0.0.0.0', port: 8081, strictPort: true, open: false },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    target: 'esnext',
    rollupOptions: { input: './index.html' },
  },
  esbuild: { target: 'esnext' },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
    esbuildOptions: { target: 'esnext' },
  },
  publicDir: 'public',
  base: './',
}));
