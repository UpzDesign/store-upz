import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { INTAKE_FORMS } from "../lib/intake-forms";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const companies = [
  {
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
  {
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
];

async function seedCompanies() {
  const records = [];

  for (const company of companies) {
    records.push(
      await prisma.company.upsert({
        where: { slug: company.slug },
        update: company,
        create: company,
      })
    );
  }

  return records;
}

async function seedServiceLibrary() {
  const definitions = Object.values(INTAKE_FORMS);
  const serviceRecords = [];

  for (let serviceIndex = 0; serviceIndex < definitions.length; serviceIndex++) {
    const definition = definitions[serviceIndex];
    const service = await prisma.service.upsert({
      where: { slug: definition.slug },
      update: {
        name: definition.name,
        description: definition.description,
        active: true,
        sortOrder: serviceIndex,
      },
      create: {
        slug: definition.slug,
        name: definition.name,
        description: definition.description,
        active: true,
        sortOrder: serviceIndex,
      },
    });

    for (let fieldIndex = 0; fieldIndex < definition.fields.length; fieldIndex++) {
      const field = definition.fields[fieldIndex];

      await prisma.serviceField.upsert({
        where: {
          serviceId_key: {
            serviceId: service.id,
            key: field.key,
          },
        },
        update: {
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || null,
          required: Boolean(field.required),
          wide: Boolean(field.wide),
          options: field.options || undefined,
          sortOrder: fieldIndex,
        },
        create: {
          serviceId: service.id,
          key: field.key,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || null,
          required: Boolean(field.required),
          wide: Boolean(field.wide),
          options: field.options || undefined,
          sortOrder: fieldIndex,
        },
      });
    }

    serviceRecords.push(service);
  }

  return serviceRecords;
}

async function assignServicesToCompanies(
  companyRecords: Array<{ id: number }>,
  serviceRecords: Array<{ id: number }>
) {
  for (const company of companyRecords) {
    for (let index = 0; index < serviceRecords.length; index++) {
      const service = serviceRecords[index];

      await prisma.companyService.upsert({
        where: {
          companyId_serviceId: {
            companyId: company.id,
            serviceId: service.id,
          },
        },
        update: {
          enabled: true,
          sortOrder: index,
        },
        create: {
          companyId: company.id,
          serviceId: service.id,
          enabled: true,
          sortOrder: index,
        },
      });
    }
  }
}

async function main() {
  const companyRecords = await seedCompanies();
  const serviceRecords = await seedServiceLibrary();
  await assignServicesToCompanies(companyRecords, serviceRecords);

  console.log(
    `Seeded ${companyRecords.length} companies, ${serviceRecords.length} services, and company service assignments.`
  );
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
