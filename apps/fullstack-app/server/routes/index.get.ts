import { defineHandler } from "nitro";

export default defineHandler(
  () =>
    new Response(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hello, World!</title>
  </head>
  <body>
    <main>
      <h1>Hello, World!</h1>
      <p>This is the Meta XR landing page.</p>
      <p><a href="/app">Open the VR app</a></p>
    </main>
  </body>
</html>`,
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    ),
);
