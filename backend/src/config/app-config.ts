import env from "./env";

export const appConfig = {
  env: env.NODE_ENV,
  port: Number(env.PORT),
  host: process.env.HOST ?? "0.0.0.0",
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  bodyLimit: process.env.BODY_LIMIT ?? "10mb",
} as const;