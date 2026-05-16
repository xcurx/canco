import { PrismaClient } from "./prisma/src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { withAccelerate } from "@prisma/extension-accelerate"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
 
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter }).$extends(withAccelerate())
 
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma