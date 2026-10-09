import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

async function access(id:number){
 const session=await requireStaffSession(["admin","manager"]);
 if(!session)return {error:NextResponse.json({error:"Financial access required"},{status:403})};
 const project=await prisma.project.findUnique({where:{id},select:{id:true,assignedTo:true,tasks:{select:{id:true,title:true},orderBy:{sortOrder:"asc"}}}});
 if(!project)return {error:NextResponse.json({error:"Project not found"},{status:404})};
 if(session.role==="manager"&&project.assignedTo!==session.name)return {error:NextResponse.json({error:"Managed-project access required"},{status:403})};
 return {session,project};
}
export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}){
 const {id}=await context.params;const result=await access(Number(id));
 if(result.error)return result.error;
 const expenses=await prisma.stageExpense.findMany({where:{task:{projectId:Number(id)}},include:{task:{select:{id:true,title:true}}},orderBy:{createdAt:"desc"}});
 return NextResponse.json({expenses,tasks:result.project!.tasks},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 const {id}=await context.params;const result=await access(Number(id));
 if(result.error)return result.error;
 const body=await request.json().catch(()=>({}));
 const description=String(body.description||"").trim();
 const amount=Number(body.amount);
 if(!description||description.length>200||!Number.isFinite(amount)||amount<=0||amount>100000000)return NextResponse.json({error:"Enter an item and a valid amount greater than zero."},{status:400});
 const taskId=Number(body.taskId||result.project!.tasks[0]?.id);
 if(!result.project!.tasks.some(t=>t.id===taskId))return NextResponse.json({error:"Add a project stage before recording expenses."},{status:400});
 const expense=await prisma.stageExpense.create({data:{taskId,description,actualCost:Math.round(amount*100)/100,category:"Other",expenseDate:new Date(),createdBy:result.session!.name}});
 await prisma.projectActivity.create({data:{projectId:Number(id),type:"expense_added",message:`Expense: ${description} · $${expense.actualCost.toFixed(2)}`,actor:result.session!.name}});
 return NextResponse.json(expense,{status:201});
}
export async function DELETE(request:NextRequest,context:{params:Promise<{id:string}>}){
 const {id}=await context.params;const result=await access(Number(id));
 if(result.error)return result.error;
 const expenseId=Number(new URL(request.url).searchParams.get("expenseId"));
 if(!Number.isSafeInteger(expenseId)||expenseId<=0)return NextResponse.json({error:"Invalid expense"},{status:400});
 const expense=await prisma.stageExpense.findFirst({where:{id:expenseId,task:{projectId:Number(id)}}});
 if(!expense)return NextResponse.json({error:"Expense not found"},{status:404});
 await prisma.stageExpense.delete({where:{id:expense.id}});
 return NextResponse.json({ok:true});
}
