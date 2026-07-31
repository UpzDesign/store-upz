"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["Dashboard", "/admin"],
  ["Requests", "/admin/inbox"],
  ["Notifications", "/admin/notifications"],
  ["Work Management", "/admin/operations"],
  ["Projects", "/admin/projects"],
  ["Deliverables", "/admin/deliverables"],
  ["Activity Center", "/admin/activity-center"],
  ["Companies", "/admin/companies"],
  ["Team", "/admin/team"],
  ["Services", "/admin/services"],
  ["Templates", "/admin/templates"],
] as const;
const READ_KEY="upz_admin_read_notifications";

function openSearch() {
  window.dispatchEvent(new CustomEvent("upz-open-admin-search"));
}

export default function AdminWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [unread,setUnread]=useState(0);

  useEffect(() => {
    const sync = () => setAuthenticated(window.localStorage.getItem("upz_admin") === "true");
    sync();
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener("upz-admin-auth", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("upz-admin-auth", sync as EventListener);
    };
  }, [pathname]);

  useEffect(()=>{
   if(!authenticated)return;
   const refresh=()=>fetch("/api/admin/activity-center",{cache:"no-store"}).then(response=>response.ok?response.json():{items:[]}).then(data=>{
    let read:string[]=[];try{read=JSON.parse(localStorage.getItem(READ_KEY)||"[]")}catch{}
    const items=Array.isArray(data?.items)?data.items:[];
    const important=items.filter((item:any)=>item.actionable||item.category==="Requests"||item.category==="Attention"||item.kind==="client_response"||["assignment_changed","stage_ready","project_completed"].includes(item.kind)||item.priority==="urgent"||item.priority==="high");
    setUnread(important.filter((item:any)=>!read.includes(item.id)).length);
   }).catch(()=>{});
   refresh();window.addEventListener("upz-notifications-read",refresh);return()=>window.removeEventListener("upz-notifications-read",refresh);
  },[authenticated,pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  const showShell = ready && (authenticated || pathname !== "/admin");
  if (!showShell) return <>{children}</>;

  return (
    <div className="admin-workspace-shell">
      <aside className="admin-workspace-sidebar">
        <Link className="admin-workspace-brand" href="/admin">
          <img src="/upz-logo.svg" alt="UPZ Design" />
          <div><strong>UPZ Admin</strong><span>Creative Operations</span></div>
        </Link>
        <nav aria-label="Admin navigation">
          {NAV.map(([label, href]) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href) || (href === "/admin/projects" && pathname.startsWith("/admin/engagements"));
            return <Link key={label} href={href} className={active ? "active" : ""}><span>{label}</span>{label==="Notifications"&&unread>0&&<b className="admin-nav-count">{unread>99?"99+":unread}</b>}</Link>;
          })}
        </nav>
        <div className="admin-workspace-foot">
          <button type="button" onClick={openSearch}>Global Search <kbd>⌘K</kbd></button>
          <Link href="/">Open Store</Link>
        </div>
      </aside>
      <div className="admin-workspace-content">
        <div className="admin-page-frame">{children}</div>
      </div>
    </div>
  );
}
