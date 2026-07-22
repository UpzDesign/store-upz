"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Command = {
  type?: string;
  label: string;
  detail: string;
  href: string;
  keywords?: string;
};

const base: Command[] = [
  { label: "Admin Dashboard", detail: "Overview and companies", href: "/admin", keywords: "home dashboard" },
  { label: "Operations", detail: "Kanban, team, assets and approvals", href: "/admin/operations", keywords: "production board workload assets approvals" },
  { label: "Engagements", detail: "Property and campaign workspaces", href: "/admin/engagements", keywords: "projects properties campaigns" },
  { label: "Service Library", detail: "Manage shared intake services", href: "/admin/services", keywords: "photography signage website branding" },
  { label: "New Company", detail: "Create a client workspace", href: "/admin/new-company", keywords: "client portal company" },
];

export default function AdminCommandPalette() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<Command[]>([]);

  useEffect(() => {
    const openPalette = () => setOpen(true);
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", key);
    window.addEventListener("upz-open-admin-search", openPalette);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("upz-open-admin-search", openPalette);
    };
  }, []);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setRemote([]);
      return;
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        .then((response) => (response.ok ? response.json() : []))
        .then((data) => setRemote(Array.isArray(data) ? data : []))
        .catch(() => setRemote([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  const results = useMemo(() => {
    const value = query.toLowerCase();
    const local = base.filter((item) => !value || `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(value));
    return [...remote, ...local]
      .filter((item, index, all) => all.findIndex((candidate) => candidate.href === item.href && candidate.label === item.label) === index)
      .slice(0, 16);
  }, [query, remote]);

  if (!pathname?.startsWith("/admin")) return null;

  return (
    <>
      {open && (
        <div className="admin-command-backdrop" onMouseDown={() => setOpen(false)}>
          <section className="admin-command-palette" role="dialog" aria-modal="true" aria-label="Search admin workspace" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-command-search">
              <span aria-hidden="true">⌕</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search companies, engagements, work orders, tasks, assets..."
              />
              <kbd>ESC</kbd>
            </div>
            <div className="admin-command-results">
              {results.length ? (
                results.map((item, index) => (
                  <Link
                    key={`${item.href}-${item.label}-${index}`}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.type ? `${item.type} · ` : ""}{item.detail}</span>
                  </Link>
                ))
              ) : (
                <p>No matching workspace content.</p>
              )}
            </div>
            <footer>
              <span>Universal UPZ search</span>
              <span className="admin-command-shortcut">⌘K / Ctrl+K</span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
