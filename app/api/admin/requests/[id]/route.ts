import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseId(id:string){const value=Number(id);return Number.isInteger(value)&&value>0?value:null;}

export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params;const requestId=parseId(id);
    if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});

    const item=await prisma.marketingRequest.findUnique({where:{id:requestId}});
    if(!item)return NextResponse.json({error:"Request not found"},{status:404});

    const company=await prisma.company.findUnique({
      where:{id:item.companyId},
      select:{name:true,shortName:true,slug:true,logo:true,primaryColor:true,secondaryColor:true}
    });
    if(!company)return NextResponse.json({error:"Request company not found"},{status:404});

    let project:null|{id:number;status:string}=null;
    try{
      project=await prisma.project.findUnique({where:{requestId:item.id},select:{id:true,status:true}});
    }catch(error){
      console.warn("Unable to load request project relation:",error);
    }

    return NextResponse.json({...item,company,project},{headers:{"Cache-Control":"no-store, max-age=0"}});
  }catch(error){console.error("Admin request detail error:",error);return NextResponse.json({error:"Unable to load request"},{status:500});}
}

export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params;const requestId=parseId(id);const body=await request.json().catch(()=>null);
    if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});
    const updated=await prisma.marketingRequest.update({where:{id:requestId},data:{status:body?.status?String(body.status).trim():undefined,priority:body?.priority?String(body.priority).trim():undefined,title:body?.title?String(body.title).trim():undefined,description:body?.description===""?null:body?.description?String(body.description).trim():undefined}});
    let project:null|{id:number;status:string}=null;
    try{project=await prisma.project.findUnique({where:{requestId:requestId},select:{id:true,status:true}});}catch{}
    return NextResponse.json({...updated,project});
  }catch(error){console.error("Admin request update error:",error);return NextResponse.json({error:"Unable to update request"},{status:500});}
}

export async function DELETE(_request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params;const requestId=parseId(id);
    if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});
    const existing=await prisma.marketingRequest.findUnique({where:{id:requestId},select:{id:true,project:{select:{id:true}}}});
    if(!existing)return NextResponse.json({error:"Request not found"},{status:404});
    await prisma.$transaction(async(tx)=>{
      if(existing.project)await tx.project.update({where:{id:existing.project.id},data:{requestId:null}});
      await tx.marketingRequest.delete({where:{id:requestId}});
    });
    return NextResponse.json({deleted:true,id:requestId,projectPreserved:Boolean(existing.project)});
  }catch(error){console.error("Admin request delete error:",error);return NextResponse.json({error:"Unable to delete request"},{status:500});}
}
