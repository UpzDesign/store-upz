import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { marketingExpansionSuggestions } from "@/lib/marketing-expansion";

function parseId(id:string){const value=Number(id);return Number.isInteger(value)&&value>0?value:null;}
function parseContext(value?:string|null){const source=value||"",marker="__UPZ_CONTEXT__",index=source.lastIndexOf(marker);if(index<0)return{} as Record<string,any>;try{return JSON.parse(source.slice(index+marker.length).trim())||{}}catch{return{} as Record<string,any>}}
function rawDescription(value?:string|null){const source=value||"",marker="__UPZ_CONTEXT__",index=source.lastIndexOf(marker);return(index>=0?source.slice(0,index):source).trim()}

export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const {id}=await context.params;const requestId=parseId(id);
    if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});

    const item=await prisma.marketingRequest.findUnique({where:{id:requestId}});
    if(!item)return NextResponse.json({error:"Request not found"},{status:404});

    const company=await prisma.company.findUnique({where:{id:item.companyId},select:{name:true,shortName:true,slug:true,logo:true,primaryColor:true,secondaryColor:true}});
    if(!company)return NextResponse.json({error:"Request company not found"},{status:404});

    let project:null|{id:number;status:string}=null;
    try{project=await prisma.project.findUnique({where:{requestId:item.id},select:{id:true,status:true}})}catch(error){console.warn("Unable to load request project relation:",error)}

    const itemContext=parseContext(item.description),groupId=String(itemContext?.requestGroup?.id||itemContext?.requestGroupId||"");
    let requestGroup:any=null;
    let groupServices:string[]=[item.type];
    if(groupId){
      const siblings=await prisma.marketingRequest.findMany({where:{companyId:item.companyId},orderBy:{createdAt:"asc"},take:100});
      const related=siblings.map(entry=>({entry,context:parseContext(entry.description)})).filter(({context})=>String(context?.requestGroup?.id||context?.requestGroupId||"")===groupId);
      groupServices=related.map(({entry})=>entry.type);
      requestGroup={id:groupId,projectName:String(itemContext?.requestGroup?.projectName||itemContext?.engagementName||itemContext?.portfolioName||""),propertyType:String(itemContext?.requestGroup?.propertyType||itemContext?.answers?.propertyType||""),address:String(itemContext?.requestGroup?.address||itemContext?.propertyAddress||""),space:String(itemContext?.requestGroup?.space||itemContext?.locationName||""),services:related.map(({entry})=>({id:entry.id,name:entry.type,title:entry.title,status:entry.status,current:entry.id===item.id}))};
    }

    const base=rawDescription(item.description);
    const groupSummary=requestGroup?[
      `COORDINATED PROJECT REQUEST`,
      `${requestGroup.projectName}${requestGroup.address?` · ${requestGroup.address}`:""}`,
      `${requestGroup.services.length} requested services: ${requestGroup.services.map((service:any)=>service.name).join(", ")}`,
      `Current approval scope: ${item.type}`,
    ].join("\n\n"):"";
    const suggestions=marketingExpansionSuggestions(groupServices);
    const expansionSummary=suggestions.length?["PROTOTYPE MARKETING EXPANSION",...suggestions.map(suggestion=>`${suggestion.service}: ${suggestion.reason} Generated content: ${suggestion.generatedContent.join(", ")}.`)].join("\n\n"):"";
    const displayDescription=[groupSummary,base,expansionSummary,`__UPZ_CONTEXT__${JSON.stringify(itemContext)}`].filter(Boolean).join("\n\n");

    return NextResponse.json({...item,description:displayDescription,company,project,requestGroup,marketingSuggestions:suggestions},{headers:{"Cache-Control":"no-store, max-age=0"}});
  }catch(error){console.error("Admin request detail error:",error);return NextResponse.json({error:"Unable to load request"},{status:500});}
}

export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;const requestId=parseId(id);const body=await request.json().catch(()=>null);if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});const updated=await prisma.marketingRequest.update({where:{id:requestId},data:{status:body?.status?String(body.status).trim():undefined,priority:body?.priority?String(body.priority).trim():undefined,title:body?.title?String(body.title).trim():undefined,description:body?.description===""?null:body?.description?String(body.description).trim():undefined}});let project:null|{id:number;status:string}=null;try{project=await prisma.project.findUnique({where:{requestId:requestId},select:{id:true,status:true}})}catch{}return NextResponse.json({...updated,project});}catch(error){console.error("Admin request update error:",error);return NextResponse.json({error:"Unable to update request"},{status:500});}
}

export async function DELETE(_request:NextRequest,context:{params:Promise<{id:string}>}){
  try{const {id}=await context.params;const requestId=parseId(id);if(!requestId)return NextResponse.json({error:"Invalid request id"},{status:400});const existing=await prisma.marketingRequest.findUnique({where:{id:requestId},select:{id:true,project:{select:{id:true,engagementId:true}}}});if(!existing)return NextResponse.json({error:"Request not found"},{status:404});const projectId=existing.project?.id||null,engagementId=existing.project?.engagementId||null;await prisma.$transaction(async(tx)=>{if(projectId)await tx.project.delete({where:{id:projectId}});await tx.marketingRequest.delete({where:{id:requestId}});if(engagementId){const[remainingOrders,remainingAssets]=await Promise.all([tx.project.count({where:{engagementId}}),tx.engagementAsset.count({where:{engagementId}})]);if(remainingOrders===0&&remainingAssets===0)await tx.engagement.delete({where:{id:engagementId}})}});return NextResponse.json({deleted:true,id:requestId,projectDeleted:Boolean(projectId)});}catch(error){console.error("Admin request delete error:",error);return NextResponse.json({error:"Unable to delete request and linked project"},{status:500});}
}
