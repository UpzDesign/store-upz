import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg","image/png","image/webp","image/svg+xml","application/pdf","application/zip","application/postscript","application/illustrator","application/octet-stream"]);

export async function POST(request: NextRequest) {
  const endpoint = process.env.UPZ_STORAGE_ENDPOINT;
  const secret = process.env.UPZ_STORAGE_KEY;
  if (!endpoint || !secret) return NextResponse.json({error:"File storage is not configured."},{status:503});
  try {
    const form = await request.formData();
    const companySlug = String(form.get("companySlug")||"");
    const company = await prisma.company.findUnique({where:{slug:companySlug},select:{portalEnabled:true}});
    if (!company?.portalEnabled) return NextResponse.json({error:"Invalid company portal."},{status:404});
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({error:"Choose a file."},{status:400});
    if (file.size > MAX_BYTES || file.size === 0) return NextResponse.json({error:"File must be under 4 MB."},{status:413});
    const ext = file.name.split(".").pop()?.toLowerCase()||"";
    if (!["jpg","jpeg","png","webp","svg","pdf","zip","ai","eps"].includes(ext) || (file.type && !ALLOWED.has(file.type))) return NextResponse.json({error:"Unsupported file type."},{status:415});
    const target = new URL(endpoint);
    if (target.protocol !== "https:") return NextResponse.json({error:"Storage endpoint must use HTTPS."},{status:503});
    const upstream = new FormData();
    upstream.append("file",file,file.name);
    upstream.append("companySlug",companySlug);
    const response = await fetch(target,{method:"POST",headers:{"Authorization":`Bearer ${secret}`,"X-UPZ-Storage-Key":secret},body:upstream,cache:"no-store"});
    const data:unknown = await response.json().catch(()=>null);
    if (!response.ok) return NextResponse.json({error:"Storage upload failed."},{status:502});
    if (!data || typeof data!=="object") return NextResponse.json({error:"Unexpected storage response."},{status:502});
    const result = data as Record<string,unknown>;
    const id = String(result.id||result.fileId||result.path||"");
    if (!id) return NextResponse.json({error:"Storage did not return a file identifier."},{status:502});
    return NextResponse.json({id,name:file.name,size:file.size,type:file.type});
  } catch (error) {console.error("File upload error:",error);return NextResponse.json({error:"Unable to upload file."},{status:500});}
}
