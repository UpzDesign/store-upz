import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

const include = { checklist: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] }, comments: { orderBy: { createdAt: "desc" as const } }, attachments: { orderBy: { createdAt: "desc" as const } } };

async function permittedTask(id:number){
 const session=await requireStaffSession();if(!session)return {session:null,task:null};
 const task=await prisma.projectTask.findUnique({where:{id}});if(!task)return {session,task:null};
 if(session.role==="contributor"&&task.assignedTo!==session.name)return {session,task:false as const};
 return {session,task};
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
 const {id}=await context.params;const access=await permittedTask(Number(id));
 if(!access.session)return NextResponse.json({error:"Authentication required"},{status:401});
 if(access.task===false)return NextResponse.json({error:"Task access denied"},{status:403});
 if(!access.task)return NextResponse.json({error:"Task not found"},{status:404});
 return NextResponse.json(await prisma.projectTask.findUnique({where:{id:Number(id)},include}));
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
 try {
  const {id}=await context.params;const taskId=Number(id);const access=await permittedTask(taskId);
  if(!access.session)return NextResponse.json({error:"Authentication required"},{status:401});
  if(access.task===false)return NextResponse.json({error:"Task access denied"},{status:403});
  if(!access.task)return NextResponse.json({error:"Task not found"},{status:404});
  const task=access.task;const body=await request.json();const action=String(body?.action||"");
  if(action==="add_checklist"){
   const title=String(body?.title||"").trim();if(!title)return NextResponse.json({error:"Checklist title is required"},{status:400});
   const count=await prisma.taskChecklistItem.count({where:{taskId}});await prisma.taskChecklistItem.create({data:{taskId,title,sortOrder:count}});
   await prisma.projectActivity.create({data:{projectId:task.projectId,type:"task_checklist_added",message:`Checklist item added to ${task.title}: ${title}`,actor:access.session.name}});
  }else if(action==="toggle_checklist"){
   const itemId=Number(body?.itemId);const item=await prisma.taskChecklistItem.findFirst({where:{id:itemId,taskId}});if(!item)return NextResponse.json({error:"Checklist item not found"},{status:404});await prisma.taskChecklistItem.update({where:{id:item.id},data:{completed:!item.completed}});
  }else if(action==="add_comment"){
   const message=String(body?.message||"").trim();if(!message)return NextResponse.json({error:"Comment is required"},{status:400});
   await prisma.taskComment.create({data:{taskId,body:message,author:access.session.name,visibility:"internal"}});await prisma.projectActivity.create({data:{projectId:task.projectId,type:"task_comment",message:`Comment added to task: ${task.title}`,actor:access.session.name}});
  }else if(action==="add_attachment"){
   if(access.session.role!=="admin")return NextResponse.json({error:"Only admins can add attachments"},{status:403});
   const title=String(body?.title||"").trim();const fileUrl=String(body?.fileUrl||"").trim();if(!title||!fileUrl)return NextResponse.json({error:"Attachment title and URL are required"},{status:400});
   await prisma.taskAttachment.create({data:{taskId,title,fileUrl,fileType:body?.fileType?String(body.fileType).trim():null}});await prisma.projectActivity.create({data:{projectId:task.projectId,type:"task_attachment",message:`Attachment added to task: ${task.title}`,actor:access.session.name}});
  }else return NextResponse.json({error:"Unsupported task action"},{status:400});
  return NextResponse.json(await prisma.projectTask.findUnique({where:{id:taskId},include}),{status:201});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to update task workspace"},{status:500})}
}
