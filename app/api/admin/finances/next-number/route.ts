import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireStaffSession} from "@/lib/staff-auth";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin required"},{status:403});
 const input=request.nextUrl.searchParams.get("date")||new Date().toISOString().slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input)||Number.isNaN(new Date(input+"T12:00:00Z").getTime()))return NextResponse.json({error:"Invalid date"},{status:400});
 const prefix=input.slice(2,4)+input.slice(5,7);
 const invoices=await prisma.standaloneInvoice.findMany({where:{invoiceNumber:{startsWith:prefix}},select:{invoiceNumber:true}});
 const used=new Set(invoices.map(i=>i.invoiceNumber).filter((n):n is string=>Boolean(n)));
 let sequence=1;while(used.has(prefix+String(sequence).padStart(2,"0")))sequence++;
 return NextResponse.json({number:prefix+String(sequence).padStart(2,"0")},{headers:{"Cache-Control":"no-store"}});
}
