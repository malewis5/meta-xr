import { defineEventHandler, toRequest } from "h3";
import { auth } from "../../../utils/auth";

export default defineEventHandler((event) => auth.handler(toRequest(event.req)));
