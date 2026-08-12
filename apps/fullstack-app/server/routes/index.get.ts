import { defineEventHandler } from "h3";

export default defineEventHandler(
  () =>
    new Response(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sign in to play | Meta XR</title>
    <style>
      :root { color-scheme: dark; font-family: system-ui, sans-serif; }
      body { align-items: center; background: #111827; display: grid; margin: 0; min-height: 100vh; padding: 1.5rem; }
      main { background: #1f2937; border: 1px solid #374151; border-radius: 1rem; box-shadow: 0 1rem 3rem #0008; margin: auto; max-width: 24rem; padding: 2rem; width: 100%; }
      h1 { font-size: 2rem; margin: 0 0 .5rem; }
      p { color: #d1d5db; margin: 0 0 1.5rem; }
      form { display: grid; gap: 1rem; }
      label { display: grid; font-weight: 600; gap: .4rem; }
      input { background: #111827; border: 1px solid #6b7280; border-radius: .5rem; color: inherit; font: inherit; padding: .7rem; }
      .actions { display: grid; gap: .75rem; grid-template-columns: 1fr 1fr; }
      button { background: #8b5cf6; border: 0; border-radius: .5rem; color: white; cursor: pointer; font: inherit; font-weight: 700; padding: .75rem; }
      button[type="button"] { background: transparent; border: 1px solid #8b5cf6; }
      button:disabled { cursor: wait; opacity: .6; }
      #error { color: #fca5a5; min-height: 1.5rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>Sign in to play</h1>
      <p>Use your account to enter the Meta XR experience.</p>
      <form id="auth-form">
        <label>
          Name <input id="name" name="name" autocomplete="name" />
        </label>
        <label>
          Email <input id="email" name="email" type="email" autocomplete="email" required />
        </label>
        <label>
          Password <input id="password" name="password" type="password" autocomplete="current-password" required minlength="8" />
        </label>
        <p id="error" aria-live="polite"></p>
        <div class="actions">
          <button type="submit">Sign in</button>
          <button type="button" id="sign-up">Create account</button>
        </div>
      </form>
    </main>
    <script>
      const form = document.querySelector("#auth-form");
      const error = document.querySelector("#error");
      const signUpButton = document.querySelector("#sign-up");
      const nameInput = document.querySelector("#name");
      const emailInput = document.querySelector("#email");
      const passwordInput = document.querySelector("#password");
      const buttons = form.querySelectorAll("button");

      function getSendTo() {
        const candidate = new URLSearchParams(window.location.search).get("sendTo");
        if (!candidate) return "/app";

        const target = new URL(candidate, window.location.origin);
        return target.origin === window.location.origin
          ? target.pathname + target.search + target.hash
          : "/app";
      }

      async function submit(action) {
        error.textContent = "";
        const name = nameInput.value.trim();

        if (action === "sign-up" && !name) {
          error.textContent = "A name is required to create an account.";
          nameInput.focus();
          return;
        }

        buttons.forEach((button) => { button.disabled = true; });
        try {
          const response = await fetch("/api/auth/" + action + "/email", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email: emailInput.value,
              password: passwordInput.value,
              ...(action === "sign-up" ? { name } : {}),
            }),
          });
          const body = await response.json().catch(() => null);

          if (!response.ok) {
            error.textContent =
              typeof body?.message === "string"
                ? body.message
                : "Unable to sign in. Check your details and try again.";
            return;
          }

          window.location.assign(getSendTo());
        } catch {
          error.textContent = "Unable to reach the server. Please try again.";
        } finally {
          buttons.forEach((button) => { button.disabled = false; });
        }
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        submit("sign-in");
      });
      signUpButton.addEventListener("click", () => submit("sign-up"));
    </script>
  </body>
</html>`,
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    ),
);
