import {
  defineEventHandler,
  getRequestURL,
  redirect,
} from "h3";
import { auth } from "../utils/auth";

export default defineEventHandler(async (event) => {
  const requestURL = getRequestURL(event);
  const { pathname } = requestURL;

  if (pathname !== "/app" && !pathname.startsWith("/app/")) {
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
