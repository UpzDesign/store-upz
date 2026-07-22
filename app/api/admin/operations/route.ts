import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
  const [projects,engagements,assets,services]=await Promise.all([
    prisma.project.findMany({include:{company:{select:{name:true,shortName:true,slug:true}},engagement:{select:{id:true,name:true}},tasks:true,notes:{orderBy:{createdAt:"desc"},take:5}},orderBy:{updatedAt:"desc"}}),
    prisma.engagement.findMany({include:{company:{select:{name:true,shortName:true,slug:true}}},orderBy:{updatedAt:"desc"}}),
    prisma.engagementAsset.findMany({include:{engagement:{select:{id:true,name:true,company:{select:{shortName:true}}}}},where:{active:true},orderBy:{updatedAt:"desc"},take:100}),
    prisma.service.findMany({where:{active:true},orderBy:{sortOrder:"asc"}})
  ]);
  const people=new Map<string,{name:string;active:number;overdue:number;tasks:number}>();
  for(const project of projects){
    const names=[project.assignedTo,...project.tasks.map(t=>t.assignedTo)].filter(Boolean) as string[];
    for(const name of names){const row=people.get(name)||{name,active:0,overdue:0,tasks:0};row.tasks+=1;if(!["complete","completed","cancelled"].includes(project.status.toLowerCase()))row.active+=1;if(project.dueDate&&new Date(project.dueDate)<new Date())row.overdue+=1;people.set(name,row)}
  }
  return NextResponse.json({projects,engagements,assets,services,team:[...people.values()].sort((a,b)=>b.active-a.active)});
}
