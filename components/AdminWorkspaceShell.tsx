"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const WORKFLOW_NAV = [
  ["Dashboard", "/admin"],
  ["Requests", "/admin/inbox"],
  ["Work Management", "/admin/operations"],
  ["Projects", "/admin/projects"],
  ["Deliverables", "/admin/deliverables"],
  ["Activity Center", "/admin/activity-center"],
] as const;

const SETTINGS_NAV = [
  ["Companies", "/admin/companies"],
  ["Team", "/admin/team"],
  ["Services", "/admin/services"],
  ["Workflow Templates", "/admin/templates"],
] as const;

const READ_KEY = "upz_admin_read_notifications";

type NotificationItem = {
  id: string;
  kind: string;
  category: string;
  title: string;
  message: string;
  priority?: string;
  href: string;
  actionable: boolean;
  createdAt: string;
  company: { shortName: string; primaryColor?: string | null };
};

const important = (item: NotificationItem) =>
  item.actionable ||
  item.category === "Requests" ||
  item.category === "Attention" ||
  item.kind === "client_response" ||
  ["assignment_changed", "stage_ready", "project_completed"].includes(item.kind) ||
  item.priority === "urgent" ||
  item.priority === "high";

function openSearch() {
  window.dispatchEvent(new CustomEvent("upz-open-admin-search"));
}

export default function AdminWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  useEffect(() => {
    if (!authenticated) return;
    const refresh = () => {
      let stored: string[] = [];
      try { stored = JSON.parse(localStorage.getItem(READ_KEY) || "[]"); } catch {}
      setReadIds(stored);
      fetch("/api/admin/activity-center", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : { items: [] })
        .then((data) => {
          const items = Array.isArray(data?.items) ? data.items : [];
          setNotifications(items.filter(important).slice(0, 30));
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener("upz-notifications-read", refresh);
    return () => window.removeEventListener("upz-notifications-read", refresh);
  }, [authenticated, pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = useMemo(() => notifications.filter((item) => !readIds.includes(item.id)).length, [notifications, readIds]);
  const preview = notifications.slice(0, 6);

  function markRead(id: string) {
    if (readIds.includes(id)) return;
    const next = [...readIds, id].slice(-500);
    setReadIds(next);
    localStorage.setItem(READ_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("upz-notifications-read"));
  }

  function markAllRead() {
    const next = Array.from(new Set([...readIds, ...notifications.map((item) => item.id)])).slice(-500);
    setReadIds(next);
    localStorage.setItem(READ_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("upz-notifications-read"));
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await fetch("/api/staff/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("upz_admin");
    localStorage.removeItem("upz_team_member");
    window.dispatchEvent(new Event("upz-admin-auth"));
    router.replace("/admin/login");
    router.refresh();
  }

  if (pathname === "/admin/login") return <>{children}</>;

  const showShell = ready && (authenticated || pathname !== "/admin");
  if (!showShell) return <>{children}</>;

  const renderLinks = (items: readonly (readonly [string, string])[]) => items.map(([label, href]) => {
    const active = href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(href) || (href === "/admin/projects" && pathname.startsWith("/admin/engagements"));
    return <Link key={label} href={href} className={active ? "active" : ""}>{label}</Link>;
  });

  return (
    <div className="admin-workspace-shell">
      <aside className="admin-workspace-sidebar">
        <Link className="admin-workspace-brand" href="/admin">
          <img src="/upz-logo.svg" alt="UPZ Design" />
          <div><strong>UPZ Admin</strong><span>Creative Operations</span></div>
        </Link>
        <nav aria-label="Admin navigation">
          <div className="admin-nav-group">{renderLinks(WORKFLOW_NAV)}</div>
          <div className="admin-nav-group admin-nav-settings"><span className="admin-nav-eyebrow">System Settings</span>{renderLinks(SETTINGS_NAV)}</div>
        </nav>
        <div className="admin-workspace-foot">
          <button type="button" onClick={openSearch}>Global Search <kbd>⌘K</kbd></button>
          <Link href="/">Open Store</Link>
          <button type="button" className="admin-signout-button" onClick={signOut} disabled={signingOut}>{signingOut ? "Signing Out..." : "Sign Out"}</button>
        </div>
      </aside>

      <div className="admin-workspace-content">
        <div className="admin-shell-tools" ref={panelRef}>
          <button
            type="button"
            className="admin-notification-trigger"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <span aria-hidden="true">●</span>
            Notifications
            {unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
          </button>
          {notificationsOpen && (
            <div className="admin-notification-popover">
              <header><div><span>Internal Updates</span><strong>{unread ? `${unread} unread` : "You’re caught up"}</strong></div>{unread > 0 && <button type="button" onClick={markAllRead}>Mark all read</button>}</header>
              <div className="admin-notification-preview">
                {preview.map((item) => (
                  <Link
                    href={item.href}
                    key={item.id}
                    className={readIds.includes(item.id) ? "is-read" : ""}
                    style={{ "--notification-client": item.company.primaryColor || "#edbf2d" } as React.CSSProperties}
                    onClick={() => { markRead(item.id); setNotificationsOpen(false); }}
                  >
                    <i />
                    <div><span>{item.category} · {item.company.shortName}</span><strong>{item.title}</strong><small>{item.message}</small></div>
                  </Link>
                ))}
                {!preview.length && <p>No internal notifications yet.</p>}
              </div>
              <footer><Link href="/admin/activity-center" onClick={() => setNotificationsOpen(false)}>Open Activity Center</Link></footer>
            </div>
          )}
        </div>
        <div className="admin-page-frame">{children}</div>
      </div>
    </div>
  );
}
