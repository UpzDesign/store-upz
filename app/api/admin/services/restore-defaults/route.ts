import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireStaffSession} from "@/lib/staff-auth";
import {INTAKE_FORMS} from "@/lib/intake-forms";
export async function POST(){
 const session=await requireStaffSession(["admin"]);
 if(!session)return NextResponse.json({error:"Admin access required"},{status:403});
 const defaults=Object.values(INTAKE_FORMS);
 const existing=await prisma.service.findMany({select:{slug:true}});
 const saved=new Set(existing.map(item=>item.slug));
 const missing=defaults.filter(item=>!saved.has(item.slug));
 const created:string[]=[];
 for(const item of missing){
  await prisma.service.create({data:{
   slug:item.slug,name:item.name,description:item.description,
   category:item.imageUrl?`image:${item.imageUrl}`:"creative",
   sortOrder:defaults.findIndex(value=>value.slug===item.slug),
   fields:{create:item.fields.map((field,index)=>({
    key:field.key,label:field.label,type:field.type,placeholder:field.placeholder||null,
    helpText:field.helpText||null,required:Boolean(field.required),wide:Boolean(field.wide),
    options:{choices:field.options||[],visibility:field.visibility||"both",checklistStage:field.checklistStage||null,condition:field.condition||null},
    sortOrder:index
   }))}
  }});
  created.push(item.slug);
 }
 return NextResponse.json({created,existingPreserved:existing.length});
}
