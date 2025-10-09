import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

//configuration of how logs are shown according to the environment
const logConfig =
  process.env.NODE_ENV === "production"
    ? ["error", "warn"] // Only errors and warnings in production
    : ["query", "error", "warn", "info"]; // Everything in development
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig,
    errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
