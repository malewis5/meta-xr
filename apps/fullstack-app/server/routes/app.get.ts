import { defineEventHandler } from "h3";

const appScriptSource = import.meta.dev
  ? "/src/entry.ts"
  : "/assets/app-entry.js";

export default defineEventHandler(
  () =>
    new Response(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:," />
    <title>Meta XR</title>
    <style>
      :root { background: #0b1020; color: #f8fafc; font-family: system-ui, sans-serif; }
      body { margin: 0; }
      #loading-screen { align-items: center; background: radial-gradient(circle at top, #312e81, #0b1020 55%); display: grid; inset: 0; justify-items: center; position: fixed; text-align: center; transition: opacity 200ms ease, visibility 200ms ease; z-index: 1; }
      #loading-screen.is-ready { opacity: 0; visibility: hidden; }
      #loading-screen p { color: #cbd5e1; margin: .75rem 0 0; }
      .spinner { animation: spin 800ms linear infinite; border: .25rem solid #c4b5fd; border-right-color: transparent; border-radius: 50%; height: 2rem; margin: 0 auto; width: 2rem; }
      #loading-error { color: #fecaca; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
    </style>
  </head>
  <body>
    <div id="loading-screen" role="status" aria-live="polite">
      <div>
        <div class="spinner" aria-hidden="true"></div>
        <p id="loading-message">Preparing your Meta XR experience…</p>
        <p id="loading-error" hidden>Unable to start the experience. Please refresh and try again.</p>
      </div>
    </div>
    <div id="scene-container" aria-busy="true"></div>
    <script type="module" src="${appScriptSource}"></script>
  </body>
</html>`,
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    ),
);
