export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Stub values for unused Manus features
  forgeApiUrl: "",
  forgeApiKey: "",
  appId: "",
  cookieSecret: "",
  oAuthServerUrl: "",
  ownerOpenId: "",
};
