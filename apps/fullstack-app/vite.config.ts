/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { iwsdkDev } from "@iwsdk/vite-plugin-dev";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [iwsdkDev(), nitro()],
  // Each app in this workspace owns a fixed port; strictPort surfaces
  // collisions loudly instead of silently drifting (desktop-app uses 8081).
  server: { host: "0.0.0.0", port: 8091, strictPort: true, open: false },
  // Nitro's Vite plugin reads environments.client.input, not the top-level
  // rollup input. /app is a server-rendered page, so the XR bundle has to be
  // an explicit client entry or production will 404 /assets/app-entry.js as HTML.
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            main: resolve(root, "index.html"),
            "app-entry": resolve(root, "src/entry.ts"),
          },
          output: {
            entryFileNames: (chunk) =>
              chunk.name === "app-entry"
                ? "assets/app-entry.js"
                : "assets/[name]-[hash].js",
          },
        },
      },
    },
  },
  build: {
    sourcemap: mode !== "production",
    target: "esnext",
  },
  esbuild: { target: "esnext" },
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
    esbuildOptions: { target: "esnext" },
  },
}));
