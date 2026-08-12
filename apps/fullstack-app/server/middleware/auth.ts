import { defineEventHandler, getRequestURL, redirect } from "h3";
import { auth } from "../utils/auth";

const PROTECTED_ROUTES = ["/app", /^\/app\//];

const requiresSession = (pathname: string) =>
  PROTECTED_ROUTES.some((route) =>
    typeof route === "string" ? pathname === route : route.test(pathname),
  );

export default defineEventHandler(async (event) => {
  const requestURL = getRequestURL(event);
  const { pathname } = requestURL;

  if (!requiresSession(pathname)) {
    return;
  }

  const session = await auth.api.getSession({
    headers: event.req.headers,
  });

  if (!session) {
    const sendTo = `${pathname}${requestURL.search}`;
    return redirect(`/sign-in?sendTo=${encodeURIComponent(sendTo)}`, 302);
  }
});
