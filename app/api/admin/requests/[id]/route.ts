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

    const existing=await prisma.marketingRequest.findUnique({
      where:{id:requestId},
      select:{id:true,project:{select:{id:true,engagementId:true}}}
    });
    if(!existing)return NextResponse.json({error:"Request not found"},{status:404});

    const projectId=existing.project?.id||null;
    const engagementId=existing.project?.engagementId||null;

    await prisma.$transaction(async(tx)=>{
      if(projectId)await tx.project.delete({where:{id:projectId}});
      await tx.marketingRequest.delete({where:{id:requestId}});

      if(engagementId){
        const [remainingOrders,remainingAssets]=await Promise.all([
          tx.project.count({where:{engagementId}}),
          tx.engagementAsset.count({where:{engagementId}}),
        ]);
        if(remainingOrders===0&&remainingAssets===0){
          await tx.engagement.delete({where:{id:engagementId}});
        }
      }
    });

    return NextResponse.json({deleted:true,id:requestId,projectDeleted:Boolean(projectId)});
  }catch(error){console.error("Admin request delete error:",error);return NextResponse.json({error:"Unable to delete request and linked project"},{status:500});}
}
