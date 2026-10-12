import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireStaffSession} from "@/lib/staff-auth";
export const runtime="nodejs";
const defaults={businessName:"UPZ Design LLC",address:"3623 30th Street, Astoria, NY 11106",email:"info@upzdesign.com",phone:"347.596.9032",website:"www.upzdesign.com",paymentInstructions:"",footerNote:"Make all checks payable to: UPZ Design, LLC",logoSvg:null as string|null};
export async function GET(){const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin required"},{status:403});const settings=await prisma.invoiceSettings.findUnique({where:{id:1}});return NextResponse.json(settings||defaults,{headers:{"Cache-Control":"no-store"}})}
export async function PUT(request:NextRequest){const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin required"},{status:403});const body=await request.json().catch(()=>null);if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid settings"},{status:400});
 const data={businessName:String(body.businessName||"").trim().slice(0,200),address:String(body.address||"").trim().slice(0,400),email:String(body.email||"").trim().slice(0,200),phone:String(body.phone||"").trim().slice(0,80),website:String(body.website||"").trim().slice(0,200),paymentInstructions:String(body.paymentInstructions||"").trim().slice(0,2000),footerNote:String(body.footerNote||"").trim().slice(0,300),logoSvg:body.logoSvg==null?null:String(body.logoSvg)};
 if(!data.businessName||!data.address||!data.email)return NextResponse.json({error:"Business name, address and email are required"},{status:400});
 if(data.logoSvg){const svg=data.logoSvg.trim();if(svg.length>100000||!/^<svg(?:\s|>)/i.test(svg)||!/<\/svg>\s*$/i.test(svg)||/<(?:script|foreignObject|image|iframe|object|embed|use|style|animate|set|textPath)\b/i.test(svg)||/\bon\w+\s*=/i.test(svg)||/(?:href|src)\s*=/i.test(svg)||/url\s*\(/i.test(svg)||/<!|<\?/i.test(svg))return NextResponse.json({error:"SVG must be a simple self-contained vector without scripts, external assets or embedded images"},{status:400});}
 const saved=await prisma.invoiceSettings.upsert({where:{id:1},create:{id:1,...data},update:data});return NextResponse.json(saved);
}
