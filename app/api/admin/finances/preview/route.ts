import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireStaffSession} from "@/lib/staff-auth";
import {renderInvoicePDF} from "@/lib/invoice-pdf";
export const runtime="nodejs";
export async function GET(){
 const session=await requireStaffSession(["admin"]);
 if(!session)return NextResponse.json({error:"Admin required"},{status:403});
 const settings=await prisma.invoiceSettings.findUnique({where:{id:1}});
 const date=new Date(),issued=date.toISOString().slice(0,10),due=new Date(date.getTime()+14*86400000).toISOString().slice(0,10);
 const pdf=await renderInvoicePDF({
  number:"SAMPLE-001",date:issued,dueDate:due,
  billTo:["Example Client LLC","123 Sample Avenue","New York, NY 10001"],
  title:"Sample Creative Services Invoice",
  items:[{description:"Design and production services",quantity:1,rate:1250},{description:"Additional revisions and preparation",quantity:2,rate:150}],
  scope:"Sample invoice for layout review only. No real invoice is created.",
  sender:{name:settings?.businessName||"UPZ Design LLC",address:(settings?.address||"New York, NY").split("\n"),email:settings?.email||"info@upzdesign.com",phone:settings?.phone||"",website:settings?.website||""},
  logoSvg:settings?.logoSvg||null,paymentInstructions:settings?.paymentInstructions||"",footerNote:settings?.footerNote||""
 });
 return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":"inline; filename=invoice-template-preview.pdf","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
