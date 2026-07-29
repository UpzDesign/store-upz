import Link from "next/link";
import type { ReactNode } from "react";

type ClassNameProps = { children: ReactNode; className?: string };
type AdminHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children?: ReactNode;
};
type AdminStat = { label: string; value: ReactNode };
type AdminSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  action?: { href: string; label: string };
  children?: ReactNode;
};

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function AdminPage({ children, className = "" }: ClassNameProps) {
  return <main className={classes("admin-page-system", className)}>{children}</main>;
}

export function AdminHeader({ eyebrow, title, description, action, children }: AdminHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header-copy">
        {eyebrow ? <span className="admin-page-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children || action ? (
        <div className="admin-page-header-actions">
          {children}
          {action ? <Link className="admin-primary-button" href={action.href}>{action.label}</Link> : null}
        </div>
      ) : null}
    </header>
  );
}

export function AdminStats({ stats, className = "" }: { stats: AdminStat[]; className?: string }) {
  return (
    <section className={classes("admin-stat-grid", className)}>
      {stats.map((stat) => (
        <article className="admin-stat-card" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </article>
      ))}
    </section>
  );
}

export function AdminToolbar({ children, className = "" }: ClassNameProps) {
  return <div className={classes("admin-toolbar-system", className)}>{children}</div>;
}

export function AdminSection({ children, className = "" }: ClassNameProps) {
  return <section className={classes("admin-section", "admin-section-system", className)}>{children}</section>;
}

export function AdminSectionHeader({ eyebrow, title, action, children }: AdminSectionHeaderProps) {
  return (
    <div className="admin-section-heading">
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {children || action ? (
        <div className="admin-section-actions">
          {children}
          {action ? <Link className="admin-secondary-button" href={action.href}>{action.label}</Link> : null}
        </div>
      ) : null}
    </div>
  );
}

export function AdminGrid({ children, className = "" }: ClassNameProps) {
  return <div className={classes("admin-card-grid", className)}>{children}</div>;
}

export function AdminCard({ children, className = "" }: ClassNameProps) {
  return <article className={classes("admin-card-system", className)}>{children}</article>;
}

export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="admin-empty-state"><h3>{title}</h3>{description ? <p>{description}</p> : null}</div>;
}
