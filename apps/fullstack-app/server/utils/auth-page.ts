type AuthPageMode = "sign-in" | "sign-up";

export function createAuthPage(mode: AuthPageMode) {
  const isSignUp = mode === "sign-up";
  const title = isSignUp ? "Create your account" : "Sign in to play";
  const subtitle = isSignUp
    ? "Create an account to enter the Meta XR experience."
    : "Use your account to enter the Meta XR experience.";
  const alternateHref = isSignUp ? "/sign-in" : "/sign-up";
  const alternateLabel = isSignUp
    ? "Already have an account? Sign in"
    : "Need an account? Create one";

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} | Meta XR</title>
    <style>
      :root { color-scheme: dark; font-family: system-ui, sans-serif; }
      body { align-items: center; background: #111827; display: grid; margin: 0; min-height: 100vh; padding: 1.5rem; }
      main { background: #1f2937; border: 1px solid #374151; border-radius: 1rem; box-shadow: 0 1rem 3rem #0008; margin: auto; max-width: 24rem; padding: 2rem; width: 100%; }
      h1 { font-size: 2rem; margin: 0 0 .5rem; }
      p { color: #d1d5db; margin: 0 0 1.5rem; }
      form { display: grid; gap: 1rem; }
      label { display: grid; font-weight: 600; gap: .4rem; }
      input { background: #111827; border: 1px solid #6b7280; border-radius: .5rem; color: inherit; font: inherit; padding: .7rem; }
      button { background: #8b5cf6; border: 0; border-radius: .5rem; color: white; cursor: pointer; font: inherit; font-weight: 700; padding: .75rem; }
      button:disabled { cursor: wait; opacity: .6; }
      a { color: #c4b5fd; display: inline-block; margin-top: 1.25rem; }
      #error { color: #fca5a5; margin: 0; min-height: 1.5rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <form id="auth-form">
        ${
          isSignUp
            ? `<label>
          Name <input id="name" name="name" autocomplete="name" required />
        </label>`
            : ""
        }
        <label>
          Email <input id="email" name="email" type="email" autocomplete="email" required />
        </label>
        <label>
          Password <input id="password" name="password" type="password" autocomplete="${isSignUp ? "new-password" : "current-password"}" required minlength="8" />
        </label>
        <p id="error" aria-live="polite"></p>
        <button type="submit">${isSignUp ? "Create account" : "Sign in"}</button>
      </form>
      <a href="${alternateHref}">${alternateLabel}</a>
    </main>
    <script>
      const form = document.querySelector("#auth-form");
      const error = document.querySelector("#error");
      const button = form.querySelector("button");

      function getSendTo() {
        const candidate = new URLSearchParams(window.location.search).get("sendTo");
        if (!candidate) return "/app";

        const target = new URL(candidate, window.location.origin);
        return target.origin === window.location.origin
          ? target.pathname + target.search + target.hash
          : "/app";
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        error.textContent = "";
        button.disabled = true;

        try {
          const response = await fetch("/api/auth/${mode}/email", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: document.querySelector("#email").value,
              password: document.querySelector("#password").value,
              ${
                isSignUp
                  ? `name: document.querySelector("#name").value.trim(),`
                  : ""
              }
            }),
          });
          const body = await response.json().catch(() => null);

          if (!response.ok) {
            error.textContent =
              typeof body?.message === "string"
                ? body.message
                : "Unable to ${isSignUp ? "create your account" : "sign in"}. Please try again.";
            return;
          }

          window.location.assign(getSendTo());
        } catch {
          error.textContent = "Unable to reach the server. Please try again.";
        } finally {
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}
