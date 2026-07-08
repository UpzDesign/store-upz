import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const username = String(body?.username || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { slug: username },
    });

    if (!company || !company.portalEnabled || company.portalPassword !== password) {
      return NextResponse.json({ error: "Invalid company access" }, { status: 401 });
    }

    return NextResponse.json({
      company: {
        slug: company.slug,
        name: company.name,
        shortName: company.shortName,
      },
    });
  } catch (error) {
    console.error("Portal login API error:", error);
    return NextResponse.json({ error: "Unable to login" }, { status: 500 });
  }
}
