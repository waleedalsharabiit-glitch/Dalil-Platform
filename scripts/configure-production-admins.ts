import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;

if (!url || !new URL(url).hostname.endsWith("neon.tech")) {
  throw new Error("Safety check failed: DATABASE_URL must point to Neon.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  }

  if (!superAdminPassword || superAdminPassword.length < 12) {
    throw new Error("SUPER_ADMIN_PASSWORD must contain at least 12 characters.");
  }

  if (adminPassword === superAdminPassword) {
    throw new Error("The two passwords must be different.");
  }

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const superAdminHash = await bcrypt.hash(superAdminPassword, 12);

  // Separate database operations: no interactive transaction.
  await prisma.user.upsert({
    where: { email: "waleed.alsharabi.it@gmail.com" },
    update: {
      name: "مدير دليل",
      role: "ADMIN",
      isActive: true,
      password: adminHash,
    },
    create: {
      name: "مدير دليل",
      email: "waleed.alsharabi.it@gmail.com",
      role: "ADMIN",
      isActive: true,
      password: adminHash,
    },
  });

  console.log("ADMIN account configured.");

  await prisma.user.upsert({
    where: { email: "waleed.alsharabi@gmail.com" },
    update: {
      name: "مدير النظام الأعلى",
      role: "SUPER_ADMIN",
      isActive: true,
      password: superAdminHash,
    },
    create: {
      name: "مدير النظام الأعلى",
      email: "waleed.alsharabi@gmail.com",
      role: "SUPER_ADMIN",
      isActive: true,
      password: superAdminHash,
    },
  });

  console.log("SUPER_ADMIN account configured.");
  console.log("Both account operations completed.");
}

main()
  .catch((error) => {
    console.error("Operation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
