import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrintfulEnvironmentNames, testPrintfulConnection } from "@/lib/printful";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const company = await prisma.company.findUnique({ where: { slug } });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const environment = getPrintfulEnvironmentNames(company.slug);

  try {
    const connection = await testPrintfulConnection({ companySlug: company.slug });
    return NextResponse.json(connection);
  } catch (error: any) {
    console.error(`Printful connection test failed for ${company.slug}:`, error);
    return NextResponse.json(
      {
        connected: false,
        tokenEnv: environment.tokenEnv,
        storeIdEnv: environment.storeIdEnv,
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
  const company = await prisma.company.findUnique({ where: { slug } });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const storeId = body?.storeId ? String(body.storeId).trim() : null;
  const environment = getPrintfulEnvironmentNames(company.slug);

  try {
    const connection = await testPrintfulConnection({
      companySlug: company.slug,
      storeId,
    });
    return NextResponse.json(connection);
  } catch (error: any) {
    console.error(`Printful connection test failed for ${company.slug}:`, error);
    return NextResponse.json(
      {
        connected: false,
        tokenEnv: environment.tokenEnv,
        storeIdEnv: environment.storeIdEnv,
        error: error?.message || "Unable to connect to Printful",
      },
      { status: 400 }
    );
  }
}
