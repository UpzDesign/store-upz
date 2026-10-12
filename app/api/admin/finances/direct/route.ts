import {NextRequest,NextResponse} from "next/server";
import {requireStaffSession} from "@/lib/staff-auth";
import {prisma} from "@/lib/prisma";
import {MAX_UPLOAD_BYTES} from "@/lib/upz-storage-config";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin required"},{status:403});
 const form=await request.formData();
 const file=form.get("file"),companyId=Number(form.get("companyId")),title=String(form.get("title")||"").trim().slice(0,180);
 const invoiceNumber=String(form.get("invoiceNumber")||"").trim().slice(0,100),rawAmount=String(form.get("amount")||"").trim(),amount=rawAmount?Number(rawAmount):null;
 if(!(file instanceof File)||!file.name.toLowerCase().endsWith(".pdf")||file.size<1||file.size>MAX_UPLOAD_BYTES)return NextResponse.json({error:"Select a PDF under 4 MB"},{status:400});
 if(!Number.isSafeInteger(companyId)||companyId<1||!title)return NextResponse.json({error:"Company and description are required"},{status:400});
 if(amount!==null&&(!Number.isFinite(amount)||amount<0))return NextResponse.json({error:"Invalid amount"},{status:400});
 const company=await prisma.company.findUnique({where:{id:companyId},select:{id:true}});
 if(!company)return NextResponse.json({error:"Company not found"},{status:404});
 const endpoint=process.env.UPZ_STORAGE_ENDPOINT,key=process.env.UPZ_STORAGE_KEY;
 if(!endpoint||!key)return NextResponse.json({error:"Storage unavailable"},{status:503});
 const target=new URL(endpoint);if(target.protocol!=="https:")return NextResponse.json({error:"Secure storage required"},{status:503});
 const payload=new FormData();payload.append("file",file,file.name);payload.append("projectId",String(companyId));
 try{
  const response=await fetch(target,{method:"POST",headers:{"X-UPZ-Storage-Key":key},body:payload,cache:"no-store",signal:AbortSignal.timeout(60000)});
  const data=await response.json();if(!response.ok||!/^[a-f0-9]{40}$/.test(String(data.id)))throw new Error(data.error||"Storage rejected upload");
  const invoice=await prisma.standaloneInvoice.create({data:{companyId,title,invoiceNumber:invoiceNumber||null,amount,storageId:data.id,fileName:file.name}});
  return NextResponse.json({ok:true,id:invoice.id},{status:201});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Upload failed"},{status:502})}
}
