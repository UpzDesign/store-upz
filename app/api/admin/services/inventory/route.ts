import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function GET() {
  const session = await requireStaffSession(["admin"]);
  if (!session) return NextResponse.json({error:"Admin access required"},{status:403});
  const services = await prisma.service.findMany({
    orderBy:[{active:"desc"},{sortOrder:"asc"}],
    select:{id:true,slug:true,name:true,active:true,sortOrder:true,estimatedDuration:true,pricingRules:true,updatedAt:true,_count:{select:{fields:true,companies:true}}}
  });
  return NextResponse.json(services.map(service=>({
    id:service.id,slug:service.slug,name:service.name,active:service.active,
    sortOrder:service.sortOrder,fieldCount:service._count.fields,
    companyAssignments:service._count.companies,
    customizedWorkflow:Boolean(service.estimatedDuration?.startsWith("workflow:")),
    pricingConfigured:service.pricingRules!==null,
    updatedAt:service.updatedAt
  })),{headers:{"Cache-Control":"private, no-store"}});
}
