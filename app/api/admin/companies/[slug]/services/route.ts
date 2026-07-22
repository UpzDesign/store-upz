import { NextRequest, NextResponse } from "next/server";
import { getCompanyServices, saveCompanyServices } from "@/lib/service-repository";

export async function GET(_request:NextRequest,context:{params:Promise<{slug:string}>}){
  try{const {slug}=await context.params;const services=await getCompanyServices(slug,false);if(!services)return NextResponse.json({error:"Company not found"},{status:404});return NextResponse.json(services);}
  catch(error){console.error("Company services GET error:",error);return NextResponse.json({error:"Unable to load company services"},{status:500});}
}

export async function PUT(request:NextRequest,context:{params:Promise<{slug:string}>}){
  try{const {slug}=await context.params;const body=await request.json();const enabledSlugs=Array.isArray(body?.enabledSlugs)?body.enabledSlugs.map(String):[];const services=await saveCompanyServices(slug,enabledSlugs);if(!services)return NextResponse.json({error:"Company not found"},{status:404});return NextResponse.json(services);}
  catch(error){console.error("Company services PUT error:",error);return NextResponse.json({error:"Unable to save company services"},{status:500});}
}
