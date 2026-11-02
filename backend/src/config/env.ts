import "dotenv/config";

const getEnv = (key: string, required = true): string => {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`❌  Missing required environment variable: ${key}`);
  }
  return value ?? "";
};
  
const env = {
  // Server
  NODE_ENV: getEnv("NODE_ENV", false) || "development",
  PORT: getEnv("PORT", false) || "5000",
  HOST: getEnv("HOST", false) || "0.0.0.0",
  TRUST_PROXY: getEnv("TRUST_PROXY", false) || "1",
  BODY_LIMIT: getEnv("BODY_LIMIT", false) || "10mb",
  ALLOWED_ORIGINS: getEnv("ALLOWED_ORIGINS", false) || "",

  // Database
  DATABASE_URL: getEnv("DATABASE_URL"),

  // JWT
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),

  // Public origin of the Next.js frontend — reused (not duplicated) for
  // the cache-revalidation webhook below; already set for payment
  // redirect URLs.
  PUBLIC_SITE_URL: getEnv("PUBLIC_SITE_URL", false) || "http://localhost:3000",

  // Shared secret for POSTing to the frontend's app/api/revalidate route
  // after a content mutation. Optional: revalidateFrontendTags() no-ops
  // (logs, doesn't throw) when unset, same "optional integration" pattern
  // as GA4_PROPERTY_ID/PACO below.
  REVALIDATION_SECRET: getEnv("REVALIDATION_SECRET", false) || "",

} as const;

export default env;