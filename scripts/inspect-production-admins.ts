import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url || !new URL(url).hostname.endsWith("neon.tech")) {
  throw new Error("DATABASE_URL must point to Neon.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "waleed.alsharabi.it@gmail.com",
          "waleed.alsharabi@gmail.com",
        ],
      },
    },
    select: {
      email: true,
      role: true,
      isActive: true,
      password: true,
    },
  });

  for (const user of users) {
    console.log({
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: Boolean(user.password),
    });
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
