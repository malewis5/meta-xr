import { defineEventHandler, getRequestURL, redirect } from "h3";
import { auth } from "../utils/auth";

const PROTECTED_ROUTES = ["/app", /^\/app\//];
const AUTH_FORM_ROUTES = [
  "/sign-in",
  /^\/sign-in\//,
  "/sign-up",
  /^\/sign-up\//,
  "/",
];

const matchesRoute = (pathname: string, routes: Array<string | RegExp>) =>
  routes.some((route) =>
    typeof route === "string" ? pathname === route : route.test(pathname),
  );

const requiresSession = (pathname: string) =>
  matchesRoute(pathname, PROTECTED_ROUTES);

const isAuthFormRoute = (pathname: string) =>
  matchesRoute(pathname, AUTH_FORM_ROUTES);

export default defineEventHandler(async (event) => {
  const requestURL = getRequestURL(event);
  const { pathname } = requestURL;
  const needsSession = requiresSession(pathname);
  const isAuthForm = isAuthFormRoute(pathname);

  if (!needsSession && !isAuthForm) {
    return;
  }

  const session = await auth.api.getSession({
    headers: event.req.headers,
  });

  if (isAuthForm && session) {
    return redirect("/app", 302);
  }

  if (needsSession && !session) {
    const sendTo = `${pathname}${requestURL.search}`;
    return redirect(`/sign-in?sendTo=${encodeURIComponent(sendTo)}`, 302);
  }
});
