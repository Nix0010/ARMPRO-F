const isDevelopment = process.env.NODE_ENV === "development";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? (isDevelopment ? "armpro-ultra-local" : ""),
  cookieSecret: process.env.JWT_SECRET ?? (isDevelopment ? "armpro-ultra-local-secret" : ""),
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
