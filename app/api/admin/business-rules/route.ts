import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

type PricingRule={id:string;label:string;sourceKey:string;matchType:"selected"|"equals"|"number_min";matchValue?:string;clientAmount:number;internalCost:number;active:boolean};
type PricingConfig={basePrice:number;baseCost:number;rules:PricingRule[]};
const emptyConfig=():PricingConfig=>({basePrice:0,baseCost:0,rules:[]});
function normalize(value:unknown):PricingConfig{const source=value&&typeof value==="object"?value as Record<string,unknown>:{};return{basePrice:Number(source.basePrice)||0,baseCost:Number(source.baseCost)||0,rules:Array.isArray(source.rules)?source.rules.map((rule:any,index:number)=>({id:String(rule?.id||`rule-${index}`),label:String(rule?.label||"Pricing rule"),sourceKey:String(rule?.sourceKey||""),matchType:["selected","equals","number_min"].includes(rule?.matchType)?rule.matchType:"selected",matchValue:rule?.matchValue==null?"":String(rule.matchValue),clientAmount:Number(rule?.clientAmount)||0,internalCost:Number(rule?.internalCost)||0,active:rule?.active!==false})):[]};}

export async function GET(){const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin access required"},{status:403});const services=await prisma.service.findMany({where:{active:true},orderBy:[{sortOrder:"asc"},{name:"asc"}],include:{fields:{orderBy:{sortOrder:"asc"},select:{key:true,label:true,type:true,options:true}}}});return NextResponse.json(services.map(service=>({id:service.id,slug:service.slug,name:service.name,description:service.description,fields:service.fields,pricing:normalize(service.pricingRules||emptyConfig())})),{headers:{"Cache-Control":"private, no-store"}});}

export async function PUT(request:NextRequest){const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin access required"},{status:403});const body=await request.json();if(!Array.isArray(body))return NextResponse.json({error:"Pricing service list is required"},{status:400});await prisma.$transaction(body.map((item:any)=>prisma.service.update({where:{id:Number(item.id)},data:{pricingRules:normalize(item.pricing)}})));return GET();}
