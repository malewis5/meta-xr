/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { iwsdkDev } from "@iwsdk/vite-plugin-dev";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [iwsdkDev(), nitro()],
  // Each app in this workspace owns a fixed port; strictPort surfaces
  // collisions loudly instead of silently drifting (desktop-app uses 8081).
  server: { host: "0.0.0.0", port: 8091, strictPort: true, open: false },
  build: {
    // Nitro owns the output directory; Vite still owns client compilation.
    sourcemap: mode !== "production",
    target: "esnext",
    rollupOptions: {
      output: {
        entryFileNames: "assets/app-entry.js",
      },
    },
  },
  esbuild: { target: "esnext" },
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
    esbuildOptions: { target: "esnext" },
  },
}));
