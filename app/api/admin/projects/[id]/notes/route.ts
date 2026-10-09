import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeProjectUpdate, encodeStageComment, type ProjectUpdateKind } from "@/lib/project-messages";

const CLIENT_KINDS = new Set<ProjectUpdateKind>(["client_update", "feedback_request", "approval_request"]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const projectId = Number(id);
    const body = await request.json();
    const text = String(body?.body || "").trim();
    if (!projectId || !text) return NextResponse.json({ error: "Note is required" }, { status: 400 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        tasks: { orderBy: { sortOrder: "asc" }, select: { id: true, status: true } },
      },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const dailyLog=body?.kind==="daily_log";
    if(dailyLog){
      const category=String(body?.category||"general"),workDate=String(body?.workDate||"");
      const stageId=body?.stageId?Number(body.stageId):null;
      const stage=project.tasks.find(task=>task.id===stageId);
      const photos=String(body?.photoUrls||"").split("\n").map(x=>x.trim()).filter(Boolean);
      if(!["general","site_update","installation","production","survey","client_coordination"].includes(category)||!/^\d{4}-\d{2}-\d{2}$/.test(workDate)||Number.isNaN(Date.parse(workDate))||(stageId&&!stage)||photos.length>8||photos.some(url=>{try{return !["http:","https:"].includes(new URL(url).protocol)}catch{return true}}))return NextResponse.json({error:"Check log date, stage and photo links."},{status:400});
      const entry=await prisma.projectActivity.create({data:{projectId,type:"daily_log",message:text.slice(0,4000),actor:String(body?.author||"UPZ Admin"),metadata:JSON.stringify({category,workDate,stageId:stage?.id||null,photoUrls:photos})}});
      await prisma.project.update({where:{id:projectId},data:{updatedAt:new Date()}});
      return NextResponse.json(entry,{status:201});
    }
    const requestedKind = String(body?.kind || "internal");
    const isClientUpdate = CLIENT_KINDS.has(requestedKind as ProjectUpdateKind);
    const kind = isClientUpdate ? requestedKind as ProjectUpdateKind : null;
    const visibility = isClientUpdate ? "client" : "internal";

    const requestedStageId = Number(body?.stageId || 0);
    const validRequestedStage = project.tasks.find((task) => task.id === requestedStageId)?.id || null;
    const activeStage = project.tasks.find((task) => !["complete", "completed"].includes(task.status))?.id || project.tasks.at(-1)?.id || null;
    const stageId = isClientUpdate ? validRequestedStage || activeStage : validRequestedStage;

    const storedBody = isClientUpdate && kind
      ? encodeProjectUpdate(text, kind, stageId)
      : stageId
        ? encodeStageComment(text, stageId)
        : text;
    const author = body?.author || "UPZ Admin";

    const [note] = await prisma.$transaction([
      prisma.projectNote.create({ data: { projectId, body: storedBody, visibility, author } }),
      prisma.projectActivity.create({
        data: {
          projectId,
          type: isClientUpdate ? requestedKind : stageId ? "stage_comment_added" : "note_added",
          message: isClientUpdate ? "Client-visible project update posted" : stageId ? "Internal work stage comment added" : "Internal note added",
          actor: author,
          metadata: stageId ? JSON.stringify({ stageId }) : undefined,
        },
      }),
      prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } }),
    ]);

    return NextResponse.json(note, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Project note error:", error);
    return NextResponse.json({ error: "Unable to add note" }, { status: 500 });
  }
}
