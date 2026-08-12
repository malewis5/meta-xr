import { defineEventHandler } from "h3";
import { createAuthPage } from "../utils/auth-page";

export default defineEventHandler(() => createAuthPage("sign-in"));
