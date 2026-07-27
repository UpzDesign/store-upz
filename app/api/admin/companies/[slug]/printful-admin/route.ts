import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testPrintfulConnection } from "@/lib/printful";
import { deletePrintfulIntegration, getPrintfulCredentials, getPrintfulIntegration, publicPrintfulIntegration, savePrintfulIntegration, updatePrintfulConnectionMetadata } from "@/lib/printful-integration";

async function companyFor(slug: string) {
  return prisma.company.findUnique({ where: { slug } });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const company = await companyFor(slug);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  return NextResponse.json(publicPrintfulIntegration(await getPrintfulIntegration(company.id)));
}

export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await companyFor(slug);
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    const body = await request.json();
    const credential = String(body?.credential || "").trim();
    const storeId = String(body?.storeId || "").trim() || null;
    if (!credential) return NextResponse.json({ error: "Printful token is required" }, { status: 400 });
    const connection = await testPrintfulConnection({ accessToken: credential, storeId });
    const saved = await savePrintfulIntegration({ companyId: company.id, accessToken: credential, storeId: connection.store.id || storeId, storeName: connection.store.name, storeType: connection.store.type, status: "connected" });
    return NextResponse.json(publicPrintfulIntegration(saved));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to connect Printful" }, { status: 400 });
  }
}

export async function POST(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await companyFor(slug);
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    const credentials = await getPrintfulCredentials(company.id);
    if (!credentials) return NextResponse.json({ error: "Printful is not connected" }, { status: 400 });
    const connection = await testPrintfulConnection({ accessToken: credentials.accessToken, storeId: credentials.storeId });
    await updatePrintfulConnectionMetadata({ companyId: company.id, storeId: connection.store.id || credentials.storeId, storeName: connection.store.name, storeType: connection.store.type, status: "connected" });
    return NextResponse.json({ connected: true, status: "connected", storeId: connection.store.id || credentials.storeId, storeName: connection.store.name, storeType: connection.store.type });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Printful connection failed" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const company = await companyFor(slug);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  await deletePrintfulIntegration(company.id);
  return NextResponse.json({ connected: false, status: "disconnected" });
}
