import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrintfulEnvironmentNames, testPrintfulConnection } from "@/lib/printful";
import { getPrintfulCredentials } from "@/lib/printful-integration";

async function getCompanyAndCredentials(slug: string) {
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) return { company: null, credentials: null };

  const credentials = await getPrintfulCredentials(company.id);
  return { company, credentials };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { company, credentials } = await getCompanyAndCredentials(slug);

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const environment = getPrintfulEnvironmentNames(company.slug);

  try {
    const connection = credentials
      ? await testPrintfulConnection({
          accessToken: credentials.accessToken,
          storeId: credentials.storeId,
        })
      : await testPrintfulConnection({ companySlug: company.slug });

    return NextResponse.json({
      ...connection,
      source: credentials ? "database" : "environment",
    });
  } catch (error: any) {
    console.error(`Printful connection test failed for ${company.slug}:`, error);
    return NextResponse.json(
      {
        connected: false,
        tokenEnv: credentials ? null : environment.tokenEnv,
        storeIdEnv: credentials ? null : environment.storeIdEnv,
        source: credentials ? "database" : "environment",
        error: error?.message || "Unable to connect to Printful",
      },
      { status: 400 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { company, credentials } = await getCompanyAndCredentials(slug);

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedStoreId = body?.storeId ? String(body.storeId).trim() : null;
  const environment = getPrintfulEnvironmentNames(company.slug);

  try {
    const connection = credentials
      ? await testPrintfulConnection({
          accessToken: credentials.accessToken,
          storeId: requestedStoreId || credentials.storeId,
        })
      : await testPrintfulConnection({
          companySlug: company.slug,
          storeId: requestedStoreId,
        });

    return NextResponse.json({
      ...connection,
      source: credentials ? "database" : "environment",
    });
  } catch (error: any) {
    console.error(`Printful connection test failed for ${company.slug}:`, error);
    return NextResponse.json(
      {
        connected: false,
        tokenEnv: credentials ? null : environment.tokenEnv,
        storeIdEnv: credentials ? null : environment.storeIdEnv,
        source: credentials ? "database" : "environment",
        error: error?.message || "Unable to connect to Printful",
      },
      { status: 400 }
    );
  }
}
