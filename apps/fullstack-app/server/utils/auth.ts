import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { prisma } from "./prisma";

const LOCAL_DEV_URL = "https://localhost:8091";

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : LOCAL_DEV_URL);

export const auth = betterAuth({
  appName: "Meta XR",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Use the public browser origin, not the Vite/Nitro proxy Host header
  // (e.g. 127.0.0.1:55281) that Better Auth would otherwise infer.
  baseURL,
  trustedOrigins: [
    LOCAL_DEV_URL,
    "http://localhost:8091",
    "https://127.0.0.1:8091",
    "http://127.0.0.1:8091",
    "https://10.*.*.*:8091",
    "https://192.168.*.*:8091",
    "https://*.vercel.app",
    "https://*.playground-vercel.tools",
  ],
});
