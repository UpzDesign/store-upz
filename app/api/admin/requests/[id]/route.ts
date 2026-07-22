import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseId(id:string){const value=Number(id);return Number.isFinite(value)?value:null;}

export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params;const requestId=parseId(id);
    if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});
    const item=await prisma.marketingRequest.findUnique({where:{id:requestId},include:{company:{select:{name:true,shortName:true,slug:true,logo:true,primaryColor:true,secondaryColor:true}},project:true}});
    if(!item)return NextResponse.json({error:"Request not found"},{status:404});
    return NextResponse.json(item);
  }catch(error){console.error("Admin request detail error:",error);return NextResponse.json({error:"Unable to load request"},{status:500});}
}

export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params;const requestId=parseId(id);const body=await request.json().catch(()=>null);
    if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});
    const updated=await prisma.marketingRequest.update({where:{id:requestId},data:{status:body?.status?String(body.status).trim():undefined,priority:body?.priority?String(body.priority).trim():undefined,title:body?.title?String(body.title).trim():undefined,description:body?.description===""?null:body?.description?String(body.description).trim():undefined},include:{project:true}});
    return NextResponse.json(updated);
  }catch(error){console.error("Admin request update error:",error);return NextResponse.json({error:"Unable to update request"},{status:500});}
}

export async function DELETE(_request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params;const requestId=parseId(id);
    if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});
    await prisma.marketingRequest.delete({where:{id:requestId}});return NextResponse.json({deleted:true,id:requestId});
  }catch(error){console.error("Admin request delete error:",error);return NextResponse.json({error:"Unable to delete request"},{status:500});}
}
