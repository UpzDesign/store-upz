"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["Dashboard", "/admin"],
  ["Requests", "/admin/inbox"],
  ["Work Management", "/admin/operations"],
  ["Portfolios", "/admin/engagements"],
  ["Deliverables", "/admin/deliverables"],
  ["Activity Center", "/admin/activity-center"],
  ["Companies", "/admin/companies"],
  ["Team", "/admin/team"],
  ["Services", "/admin/services"],
  ["Templates", "/admin/templates"],
] as const;

function openSearch() {
  window.dispatchEvent(new CustomEvent("upz-open-admin-search"));
}

export default function AdminWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

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
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return <Link key={label} href={href} className={active ? "active" : ""}>{label}</Link>;
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
