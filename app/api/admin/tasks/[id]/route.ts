import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=await requireStaffSession();if(!session)return NextResponse.json({error:"Authentication required"},{status:401});
 const {id}=await context.params;const body=await request.json();const taskId=Number(id);const existing=await prisma.projectTask.findUnique({where:{id:taskId}});if(!existing)return NextResponse.json({error:"Task not found"},{status:404});
 if(session.role==="contributor"&&existing.assignedTo!==session.name)return NextResponse.json({error:"You can only update tasks assigned to you"},{status:403});
 const contributorData=session.role==="contributor"?{status:body.status===undefined?undefined:String(body.status)}:{title:body.title===undefined?undefined:String(body.title).trim(),status:body.status===undefined?undefined:String(body.status),priority:body.priority===undefined?undefined:String(body.priority),assignedTo:body.assignedTo===undefined?undefined:body.assignedTo?String(body.assignedTo).trim():null,dueDate:body.dueDate===undefined?undefined:body.dueDate?new Date(body.dueDate):null,sortOrder:body.sortOrder===undefined?undefined:Number(body.sortOrder)};
 const task=await prisma.projectTask.update({where:{id:taskId},data:contributorData});
 let message=`Task updated: ${task.title}.`;if(body.status!==undefined&&existing.status!==task.status)message=task.status==="complete"?`Task completed: ${task.title}.`:`Task “${task.title}” moved to ${task.status.replaceAll("_"," ")}.`;else if(session.role==="admin"&&body.assignedTo!==undefined&&existing.assignedTo!==task.assignedTo)message=task.assignedTo?`Task “${task.title}” assigned to ${task.assignedTo}.`:`Task assignment removed: ${task.title}.`;else if(session.role==="admin"&&body.sortOrder!==undefined)message=`Task order updated: ${task.title}.`;
 await prisma.projectActivity.create({data:{projectId:task.projectId,type:"task_updated",message,actor:session.name}});return NextResponse.json(task);
}

export async function DELETE(_request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin access required"},{status:403});
 const {id}=await context.params;const task=await prisma.projectTask.findUnique({where:{id:Number(id)}});if(!task)return NextResponse.json({error:"Task not found"},{status:404});await prisma.projectTask.delete({where:{id:task.id}});const remaining=await prisma.projectTask.findMany({where:{projectId:task.projectId},orderBy:{sortOrder:"asc"}});await prisma.$transaction(remaining.map((item,index)=>prisma.projectTask.update({where:{id:item.id},data:{sortOrder:index}})));await prisma.projectActivity.create({data:{projectId:task.projectId,type:"task_removed",message:`Task removed: ${task.title}.`,actor:session.name}});return NextResponse.json({ok:true});
}
