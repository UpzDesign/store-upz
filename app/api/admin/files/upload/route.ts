import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { MAX_UPLOAD_BYTES } from "@/lib/upz-storage-config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await requireStaffSession(["admin", "manager"]);
  if (!session) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  const endpoint = process.env.UPZ_STORAGE_ENDPOINT;
  const key = process.env.UPZ_STORAGE_KEY;
  if (!endpoint || !key) return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  const projectId = Number(form.get("projectId"));
  if (!(file instanceof File) || !Number.isSafeInteger(projectId) || projectId < 1) return NextResponse.json({ error: "Invalid file or project" }, { status: 400 });
  if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File must be under 25 MB" }, { status: 400 });
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["jpg","jpeg","png","webp","gif","pdf","zip","txt","tif","tiff","svg","ai","eps","psd"].includes(extension)) return NextResponse.json({ error: "Unsupported file extension" }, { status: 400 });
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { assignedTo: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (session.role === "manager" && project.assignedTo !== session.name) return NextResponse.json({ error: "Project access denied" }, { status: 403 });
  try {
    const target = new URL(endpoint);
    if (target.protocol !== "https:") throw new Error("Storage endpoint must use HTTPS");
    const payload = new FormData();
    payload.append("file", file, file.name);
    payload.append("projectId", String(projectId));
    const response = await fetch(target, { method: "POST", headers: { "X-UPZ-Storage-Key": key }, body: payload, cache: "no-store", signal: AbortSignal.timeout(60000) });
    const result = await response.json();
    if (!response.ok || !/^[a-f0-9]{40}$/.test(String(result.id))) throw new Error(result.error || "Storage rejected the upload");
    const metadata = { storageId: result.id, projectId, name: file.name, mime: file.type, size: file.size };
    const activity = await prisma.projectActivity.create({ data: { projectId, type: "project_file", message: file.name, actor: session.name, metadata: JSON.stringify(metadata) } });
    return NextResponse.json({ id: activity.id, name: file.name, url: "/api/admin/files/" + activity.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 502 });
  }
}
