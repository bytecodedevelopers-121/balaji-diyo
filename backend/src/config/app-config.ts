import env from "./env";

export const appConfig = {
  env: env.NODE_ENV,
  // Passenger (cPanel Node) may pass a unix socket path instead of a number.
  port: (Number.isNaN(Number(env.PORT)) ? env.PORT : Number(env.PORT)) as number | string,
  host: process.env.HOST ?? "0.0.0.0",
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  bodyLimit: process.env.BODY_LIMIT ?? "10mb",
} as const;