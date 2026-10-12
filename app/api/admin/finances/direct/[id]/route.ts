import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireStaffSession} from "@/lib/staff-auth";
export const runtime="nodejs";
export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Forbidden"},{status:403});
 const id=Number((await context.params).id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:"Invalid invoice"},{status:400});
 const invoice=await prisma.standaloneInvoice.findUnique({where:{id}});if(!invoice)return NextResponse.json({error:"Not found"},{status:404});
 const endpoint=process.env.UPZ_STORAGE_ENDPOINT,key=process.env.UPZ_STORAGE_KEY;if(!endpoint||!key)return NextResponse.json({error:"Storage unavailable"},{status:503});
 const url=new URL(endpoint);if(url.protocol!=="https:")return NextResponse.json({error:"HTTPS required"},{status:503});
 url.searchParams.set("id",invoice.storageId);url.searchParams.set("projectId",String(invoice.companyId));
 const result=await fetch(url,{headers:{"X-UPZ-Storage-Key":key},cache:"no-store"});if(!result.ok)return NextResponse.json({error:"File unavailable"},{status:502});
 const name=invoice.fileName.replace(/[\r\n\\/"]/g,"_").slice(0,180);
 return new NextResponse(result.body,{headers:{"Content-Type":"application/pdf","Content-Disposition":'inline; filename="'+name.replace(/[^\x20-\x7e]/g,"_")+'"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"}});
}
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Forbidden"},{status:403});
 const id=Number((await context.params).id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:"Invalid invoice"},{status:400});
 const body=await request.json().catch(()=>null);if(body?.action!=="paid")return NextResponse.json({error:"Invalid action"},{status:400});
 const result=await prisma.standaloneInvoice.updateMany({where:{id,paidAt:null},data:{paidAt:new Date()}});
 if(!result.count)return NextResponse.json({error:"Invoice already paid or not found"},{status:409});
 return NextResponse.json({ok:true});
}
