import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const databaseHost = new URL(connectionString).hostname;

if (!databaseHost.endsWith("neon.tech")) {
  throw new Error(
    "Safety check failed: DATABASE_URL must point to Neon production."
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const accounts = [
  {
    name: "مدير دليل",
    email: "waleed.alsharabi.it@gmail.com",
    role: "ADMIN" as const,
    password: process.env.ADMIN_PASSWORD,
  },
  {
    name: "مدير النظام الأعلى",
    email: "waleed.alsharabi@gmail.com",
    role: "SUPER_ADMIN" as const,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
];

async function main() {
  for (const account of accounts) {
    if (!account.password || account.password.length < 12) {
      throw new Error(
        `Password for ${account.email} must be at least 12 characters.`
      );
    }
  }

  if (accounts[0].password === accounts[1].password) {
    throw new Error("Use two different passwords for the two accounts.");
  }

  const existing = await prisma.user.findMany({
    where: {
      email: { in: accounts.map((account) => account.email) },
    },
    select: {
      email: true,
      role: true,
    },
  });

  if (existing.length > 0) {
    console.error("No accounts were created. These emails already exist:");
    for (const user of existing) {
      console.error(`${user.email} (role: ${user.role})`);
    }
    console.error(
      "Inspect existing accounts before deciding whether to modify them."
    );
    process.exitCode = 1;
    return;
  }

  const prepared = await Promise.all(
    accounts.map(async (account) => ({
      name: account.name,
      email: account.email,
      role: account.role,
      isActive: true,
      password: await bcrypt.hash(account.password!, 12),
    }))
  );

  await prisma.$transaction(async (tx) => {
    for (const account of prepared) {
      await tx.user.create({ data: account });
    }
  });

  console.log("Successfully created both administrator accounts:");
  for (const account of accounts) {
    console.log(`${account.role}: ${account.email}`);
  }
  console.log("Passwords were not printed.");
}

main()
  .catch((error) => {
    console.error("Account creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    delete process.env.ADMIN_PASSWORD;
    delete process.env.SUPER_ADMIN_PASSWORD;
  });
