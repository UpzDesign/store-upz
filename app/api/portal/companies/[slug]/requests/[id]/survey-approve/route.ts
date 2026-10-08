import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string;id:string}>}){
 const {slug,id}=await params;
 const body=await request.json().catch(()=>({}));
 if(!["approve","approve_report"].includes(body.action))return NextResponse.json({error:"Invalid action"},{status:400});
 const company=await prisma.company.findUnique({where:{slug}});
 if(!company?.portalEnabled)return NextResponse.json({error:"Not found"},{status:404});
 const item=await prisma.marketingRequest.findFirst({where:{id:Number(id),companyId:company.id}});
 if(!item)return NextResponse.json({error:"Not found"},{status:404});
 const marker="__UPZ_CONTEXT__",source=item.description||"",index=source.lastIndexOf(marker);
 if(index<0)return NextResponse.json({error:"Missing request details"},{status:400});
 let data:Record<string,any>={};try{data=JSON.parse(source.slice(index+marker.length).trim())}catch{return NextResponse.json({error:"Invalid request details"},{status:400})}
 if(body.action==="approve_report"){if(data.surveyReview?.status!=="awaiting_client")return NextResponse.json({error:"No survey report awaiting approval"},{status:409});const surveyReview={...data.surveyReview,status:"approved",approvedAt:new Date().toISOString()};await prisma.marketingRequest.update({where:{id:item.id},data:{description:source.slice(0,index).trim()+"\n\n"+marker+JSON.stringify({...data,surveyReview}),status:"survey_report_approved"}});return NextResponse.json({surveyReview});}
 if(data.answers?.signagePath!=="survey_first"||data.surveyQuote?.status!=="awaiting_client"||!(Number(data.surveyQuote.fee)>0))return NextResponse.json({error:"No survey proposal awaiting approval"},{status:409});
 const surveyQuote={...data.surveyQuote,status:"approved",approvedAt:new Date().toISOString(),creditPolicy:"full"};
 await prisma.marketingRequest.update({where:{id:item.id},data:{description:source.slice(0,index).trim()+"\n\n"+marker+JSON.stringify({...data,surveyQuote}),status:"survey_approved"}});
 return NextResponse.json({surveyQuote});
}