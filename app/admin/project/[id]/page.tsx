import { redirect } from "next/navigation";

export default async function ProjectWorkspaceRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/operations?project=${id}`);
}
