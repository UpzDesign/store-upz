import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.company.upsert({
    where: { slug: "rtl" },
    update: {
      name: "RTL Realty Group",
      shortName: "RTL",
      logo: "/rtl-logo.svg",
      primaryColor: "#DC353C",
      secondaryColor: "#010101",
      heroTitle: "RTL Brand Portal",
      heroText:
        "Approved branded merchandise, broker kits, marketing materials, and brand assets for the RTL team.",
      portalPassword: "rtldemo",
      printfulTokenEnv: "PRINTFUL_ACCESS_TOKEN_RTL",
      portalEnabled: true,
    },
    create: {
      name: "RTL Realty Group",
      slug: "rtl",
      shortName: "RTL",
      logo: "/rtl-logo.svg",
      primaryColor: "#DC353C",
      secondaryColor: "#010101",
      heroTitle: "RTL Brand Portal",
      heroText:
        "Approved branded merchandise, broker kits, marketing materials, and brand assets for the RTL team.",
      portalPassword: "rtldemo",
      printfulTokenEnv: "PRINTFUL_ACCESS_TOKEN_RTL",
      portalEnabled: true,
    },
  });

  await prisma.company.upsert({
    where: { slug: "ksr" },
    update: {
      name: "KSR",
      shortName: "KSR",
      logo: "/ksr-logo.svg",
      primaryColor: "#ff5f1b",
      secondaryColor: "#010101",
      heroTitle: "KSR Brand Portal",
      heroText:
        "Approved KSR merchandise, broker essentials, marketing materials, and brand assets in one private portal.",
      portalPassword: "ksrdemo",
      printfulTokenEnv: "PRINTFUL_ACCESS_TOKEN_KSR",
      portalEnabled: true,
    },
    create: {
      name: "KSR",
      slug: "ksr",
      shortName: "KSR",
      logo: "/ksr-logo.svg",
      primaryColor: "#ff5f1b",
      secondaryColor: "#010101",
      heroTitle: "KSR Brand Portal",
      heroText:
        "Approved KSR merchandise, broker essentials, marketing materials, and brand assets in one private portal.",
      portalPassword: "ksrdemo",
      printfulTokenEnv: "PRINTFUL_ACCESS_TOKEN_KSR",
      portalEnabled: true,
    },
  });

  console.log("Seeded RTL and KSR companies.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
