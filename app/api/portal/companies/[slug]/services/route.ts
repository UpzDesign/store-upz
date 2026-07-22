import { NextRequest, NextResponse } from "next/server";
import { getCompanyServices } from "@/lib/service-repository";

export async function GET(_request:NextRequest,context:{params:Promise<{slug:string}>}){
  try{const {slug}=await context.params;const services=await getCompanyServices(slug,true);if(!services)return NextResponse.json({error:"Company not found"},{status:404});return NextResponse.json(services);}
  catch(error){console.error("Portal services GET error:",error);return NextResponse.json({error:"Unable to load services"},{status:500});}
}
