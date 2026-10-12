import sharp from "sharp";
import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireStaffSession} from "@/lib/staff-auth";
export const runtime="nodejs";
const defaults={businessName:"UPZ Design LLC",address:"3623 30th Street, Astoria, NY 11106",email:"info@upzdesign.com",phone:"347.596.9032",website:"www.upzdesign.com",paymentInstructions:"",footerNote:"Make all checks payable to: UPZ Design, LLC",logoSvg:null as string|null};
export async function GET(){const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin required"},{status:403});const settings=await prisma.invoiceSettings.findUnique({where:{id:1}});return NextResponse.json(settings||defaults,{headers:{"Cache-Control":"no-store"}})}
export async function PUT(request:NextRequest){const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin required"},{status:403});const body=await request.json().catch(()=>null);if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid settings"},{status:400});
 const data={businessName:String(body.businessName||"").trim().slice(0,200),address:String(body.address||"").trim().slice(0,400),email:String(body.email||"").trim().slice(0,200),phone:String(body.phone||"").trim().slice(0,80),website:String(body.website||"").trim().slice(0,200),paymentInstructions:String(body.paymentInstructions||"").trim().slice(0,2000),footerNote:String(body.footerNote||"").trim().slice(0,300),logoSvg:body.logoSvg==null?null:String(body.logoSvg)};
 if(!data.businessName||!data.address||!data.email)return NextResponse.json({error:"Business name, address and email are required"},{status:400});
 if(data.logoSvg){
  const svg=data.logoSvg.trim();
  // XML namespace declarations (xmlns="http://www.w3.org/2000/svg") are normal and safe.
  // Only reject remote URLs in actual resource references, not namespace declarations.
  const remotePrefixes=["http:", "https:", "file:", "javascript:", "//"];
  const externalReference=remotePrefixes.some(prefix=>svg.toLowerCase().includes('href="'+prefix)||svg.toLowerCase().includes("href='"+prefix)||svg.toLowerCase().includes('src="'+prefix)||svg.toLowerCase().includes("src='"+prefix));
  const activeContent=["<script","<foreignobject","<iframe","<object","<embed","<!doctype","<!entity"].some(tag=>svg.toLowerCase().includes(tag));
  if(svg.length>250000 || !svg.includes("<svg") || !svg.includes("</svg>") || externalReference || activeContent) return NextResponse.json({error:"SVG contains scripts or externally linked resources."},{status:400});
  try{const info=await sharp(Buffer.from(svg),{limitInputPixels:10000000}).metadata();if(info.format!=="svg"||!info.width||!info.height||info.width>10000||info.height>10000)throw new Error("Invalid SVG dimensions");}catch{return NextResponse.json({error:"Unable to read this SVG. Please export as a standard SVG from Illustrator or Figma."},{status:400});}
 }

 const saved=await prisma.invoiceSettings.upsert({where:{id:1},create:{id:1,...data},update:data});return NextResponse.json(saved);
}
