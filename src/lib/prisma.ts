import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";


declare global {
  var prismaInstance: PrismaClient | undefined;
}


function createPrismaClient(): PrismaClient {
  const isDevelopment = process.env.NODE_ENV === "development";

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: isDevelopment 
      ? [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ]
      : [{ emit: "stdout", level: "error" }],
  });

  if (isDevelopment) {
    client.$on("query" as never, (e: { query: string; duration: number; params: string }) => {
      if (e.duration > 150) {
        console.warn(`⚠️ [CRM_DATABASE_SLOW_QUERY] (${e.duration}ms): ${e.query} | Парам: ${e.params}`);
      } else {
        console.log(` [CRM_SQL] (${e.duration}ms): ${e.query}`);
      }
    });
  }

  return client;
}

export const prisma = globalThis.prismaInstance ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaInstance = prisma;
}


const handleGracefulShutdown = async (signal: string) => {
  console.log(` [CRM_SHUTDOWN] Получен сигнал ${signal}. Закрытие пула соединений...`);
  try {
    await prisma.$disconnect();
    console.log("✅ [CRM_SHUTDOWN_SUCCESS] Пул соединений Prisma ORM очищен.");
    process.exit(0);
  } catch (error) {
    console.error("❌ [CRM_SHUTDOWN_ERROR] Ошибка при закрытии СУБД перед выходом:", error);
    process.exit(1);
  }
};

if (typeof process !== "undefined") {
  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");
  process.on("SIGINT", () => void handleGracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => void handleGracefulShutdown("SIGTERM"));
}
