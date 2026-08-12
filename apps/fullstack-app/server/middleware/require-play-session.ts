import { defineEventHandler, getRequestURL, redirect } from "h3";
import { auth } from "../utils/auth";

const PUBLIC_ROUTES = ["/", /^\/api\/auth(?:\/|$)/];

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some((route) =>
    typeof route === "string" ? pathname === route : route.test(pathname),
  );

export default defineEventHandler(async (event) => {
  const requestURL = getRequestURL(event);
  const { pathname } = requestURL;

  if (isPublicRoute(pathname)) {
    return;
  }

  const session = await auth.api.getSession({
    headers: event.req.headers,
  });

  if (!session) {
    const sendTo = `${pathname}${requestURL.search}`;
    return redirect(`/?sendTo=${encodeURIComponent(sendTo)}`, 302);
  }
});
