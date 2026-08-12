# IWSDK friction log — upstream bugs

Issues discovered running two unmodified `iwsdk create` scaffolds (`@iwsdk/*@0.5.1`)
inside a pnpm + Turborepo monorepo (`pnpm@10.34.1`, `turbo@2.5.x`, Vite 7.3.6).
These are defects in the published packages/templates, not in our configuration.
Local workarounds are in place (noted per issue), but each deserves an upstream
issue/PR.

---

## 1. `@iwsdk/cli`: package-manager detection ignores workspace roots

**Severity:** medium — cosmetic noise today, wrong-PM behavior risk generally.

**What happens.** `iwsdk dev up` spawns the inner Vite process via a package
manager it detects itself (`detectPackageManager()` in `dist/cli.js`, ~line 8630).
Detection only looks at the **app directory**:

1. `packageManager` field in the app's own `package.json`
2. a lockfile (`pnpm-lock.yaml` / `yarn.lock` / `bun.lock*`) **in that same directory**
3. fallback: `npm`

In any pnpm/yarn/bun **workspace**, both signals live at the monorepo root, not in
the app package. Detection silently falls back to npm, so the CLI runs
`npm run dev:runtime` nested inside a pnpm process tree. pnpm exports its settings
to children as `npm_config_*` env vars, which npm doesn't recognize, producing a
wall of warnings on every `dev` start:

```
npm warn Unknown env config "verify-deps-before-run". This will stop working in the next major version of npm.
npm warn Unknown env config "_jsr-registry". ...
npm warn Unknown env config "minimum-release-age". ...
```

Beyond the noise, the spawned PM doesn't match the install layout (npm script
resolution, lifecycle env, and bin linking semantics differ from pnpm's).

**Expected.** Detection should walk up parent directories to the workspace root —
the same behavior as corepack, Vite, and Turborepo — before falling back to npm.

**Local workaround.** Added `"packageManager": "pnpm@10.34.1"` to each app's
`package.json` (the field the CLI checks first). Standard metadata, kept even if
upstream fixes the walk-up.

---

## 2. `@iwsdk/core`: `three` declared as a regular dependency instead of a peer

**Severity:** high — duplicate library instances in the runtime graph under pnpm.

**What happens.** `@iwsdk/core@0.5.1` declares:

```json
"dependencies": { "three": "*", ... }
```

while the scaffolded app aliases `"three": "npm:super-three@0.181.0"`. Under npm's
hoisting these collapse to one copy; under pnpm's isolated linker they do not.
Result in our workspace store (`node_modules/.pnpm`):

- `super-three@0.181.0` — the app's `three`
- `three@0.185.1` — what `@iwsdk/core`, `@iwsdk/locomotor`, `@iwsdk/xr-input`,
  `three-mesh-bvh`, and `@pmndrs/uikit` physically link against
- `three@0.184.0` — pulled by the `@iwer/sem` emulator
- **two peer-keyed builds of `@pmndrs/uikit@1.0.75`** — one resolved against
  `super-three@0.181.0` (via `@drawcall/uikitml`'s peer), one against
  `three@0.185.1` (via core's regular dep)

`@iwsdk/vite-plugin-dev` partially masks this with a forced
`resolve.dedupe: ['three']` (bundler-level patch over an installer-level problem),
which collapses `three` imports onto the app's alias at bundle time. But:

- `@pmndrs/uikit` is **not** in the dedupe list, so two distinct uikit module
  instances can ship in the bundle — separate class identities, signals, and
  caches between `@drawcall/uikitml` and core's spatial UI (`instanceof` and
  shared-state hazards), plus duplicate bundle weight.
- Core is compiled/typed against `three@0.185.x` but executes `super-three@0.181`
  after dedupe — silent version skew.

This is the exact "duplicate Three.js instance" trap the scaffold's own
CLAUDE.md/AGENTS.md warns users about, reintroduced by the SDK's own packaging.

**Expected.** `three` should be a `peerDependency` of `@iwsdk/core` (and its
siblings `@iwsdk/locomotor`, `@iwsdk/xr-input`), so the host app's aliased
`super-three` satisfies the whole graph and `@pmndrs/uikit` resolves once.
Alternatively/additionally, `@iwsdk/vite-plugin-dev` should add `@pmndrs/uikit`
to its dedupe list.

**Local workaround.** Workspace-wide override in `pnpm-workspace.yaml`:
`"three@*": npm:super-three@0.181.0`, forcing every `three` resolution onto the
alias, which collapses the graph to a single three and a single uikit build
(matching what npm hoisting produces).

Gotcha hit while applying it (pnpm behavior, useful for anyone reproducing):
adding the override to a workspace with an **existing** `pnpm-lock.yaml` does
not re-resolve already-locked edges — even with `pnpm install --force`,
auto-installed peers (e.g. `@iwsdk/xr-input`'s `three >=0.160.0`) kept
`three@0.185.1`. The override only applies fully on a fresh resolve
(delete `pnpm-lock.yaml`, reinstall).

---

## 3. `iwsdk create` template: sourcemaps ship in production builds

**Severity:** low — correctness of the scaffolded `vite.config.ts`.

**What happens.** The template emits:

```ts
build: {
  sourcemap: process.env.NODE_ENV !== 'production',
}
```

This is evaluated when the config module is imported — **before** Vite sets
`NODE_ENV` for the build. A plain `vite build` (NODE_ENV unset in the invoking
shell, the common case in CI) evaluates to `true` and ships full sourcemaps in
the production bundle.

**Expected.** Use the function form so the check keys off Vite's resolved mode:

```ts
export default defineConfig(({ mode }) => ({
  build: { sourcemap: mode !== 'production', ... },
}));
```

**Local workaround.** Config is scaffolded into the app, so we fix our copies
directly; upstream fix belongs in the create template.

---

## 4. `@iwsdk/vite-plugin-dev` + scaffold: module resolution assumes npm hoisting; dev server 500s and the editor never becomes ready under pnpm

**Severity:** high — with a pnpm install the app 500s on page load and
`iwsdk dev up` ends in `browser_launch_failed` (`page.waitForFunction: Timeout
15000ms exceeded`); `browserCommandReady` never turns true, so every
browser-backed MCP/CLI command is dead.

**What happens.** Two mechanisms, one root cause:

1. **`optimizeDeps` exclusions.** The scaffolded `vite.config.ts` excludes
   `@babylonjs/havok`, and the plugin force-excludes `@zappar/msdf-generator`,
   `lucide`, and `preact` (`OPTIMIZER_EXCLUSIONS`). Vite resolves excluded bare
   imports reached from optimized chunks (`node_modules/.vite/deps/chunk-*.js`)
   against the **app root**. None of these packages are dependencies of the
   app — they are transitive deps of `@iwsdk/core` / `@pmndrs/uikit`. npm's
   hoisting happens to make them resolvable from the app; pnpm's isolated
   layout does not:

   ```
   Failed to resolve import "@babylonjs/havok" from "node_modules/.vite/deps/chunk-E2EWVJN5.js"
   Failed to resolve import "@zappar/msdf-generator" from "node_modules/.vite/deps/chunk-TTVYMRKM.js"
   ```

2. **Virtual-module bare imports.** The plugin composes the editor's virtual
   module `/@iwsdk-editor-runtime` (`createEditorRuntimeModuleSource`) using
   helper functions that probe hardcoded relative candidate paths
   (`../node_modules/three-viewport-gizmo/...`,
   `../../../core/src/index.ts`, ...) which only exist in the iwsdk monorepo
   checkout or an npm-hoisted install. When every candidate misses, they fall
   back to bare specifiers (`three-viewport-gizmo`,
   `@iwsdk/scene-composition`). A virtual module has no filesystem location,
   so Vite resolves those from the app root — unresolvable under pnpm:

   ```
   Failed to resolve import "three-viewport-gizmo" from "\0/@iwsdk-editor-runtime"
   ```

   The editor shell therefore 500s, the managed browser's readiness
   `waitForFunction` times out, and the session reports
   `browser_launch_failed` even though the **runtime** role boots fine (the
   IWSDK banner logs with zero console errors).

**Expected.** The plugin should resolve its editor-runtime imports to
absolute `/@fs/` paths using `createRequire(import.meta.url).resolve(...)`
from its own package location instead of relative-path probing with
bare-specifier fallbacks. Packages the plugin/scaffold exclude from
`optimizeDeps` should be scaffolded as direct app dependencies (Vite's
documented requirement for excluded deps).

**Local workaround.** Declared all six hoisting-dependent packages as direct
dependencies of each app, pinned to the versions already in the SDK graph so
pnpm dedupes onto the same store copies: `@babylonjs/havok@^1.3.14`,
`@zappar/msdf-generator@^1.2.4`, `lucide@^0.468.0`, `preact@^10.29.8`,
`three-viewport-gizmo@^2.2.0`, `@iwsdk/scene-composition@0.5.1`. Verified
`browserCommandReady: true` and a clean runtime render afterwards.

---

## 5. `@iwsdk/cli`: launching a second app's managed browser closes the first app's managed browser

**Severity:** low/medium — self-healing, but the first app's command bridge
silently drops to not-ready; anything scripted against it starts failing until
the next request triggers a relaunch.

**What happens.** With two scaffolds in one workspace running concurrently
(`desktop-app` on 8081, `vr-app` on 8091, separate `iwsdk dev up` sessions):
launching the second app's managed browser coincided with the first app's
managed browser closing. Both dev logs show the same line at that moment:

```
🔄 IWSDK: Browser closed. Will relaunch on next MCP request.
```

and the first app's `dev status` flips to `browserConnected: false`,
`browserCommandReady: false` with `"status": "disconnected"` — with no error
surfaced in the session that lost its window.

Issuing any browser-backed command (e.g. `iwsdk browser screenshot`) relaunches
the window on demand, after which **both** sessions report
`browserCommandReady: true` and remain stable side by side, commands working
against each concurrently.

**Suspected mechanism** (not fully root-caused): the two CLI daemons appear to
share managed-browser state (profile/user-data-dir or singleton lock), so the
second launch tears down the first window; the on-demand relaunch then creates
a coexisting instance. Documented as observed behavior — reproduction was
consistent across the initial launch and one relaunch cycle in this workspace.

**Expected.** Managed browser instances should be isolated per workspace
session (unique user-data-dir per project), or the closure should at least be
reported as a warning in the affected session's status/logs rather than a
silent disconnect.

**Local workaround.** None needed — the bridge relaunches on the next
browser-backed request. Be aware that after starting a second app, the first
app's next scene/ecs/xr/browser command pays a relaunch delay (and transient
failures right at that boundary are expected).
