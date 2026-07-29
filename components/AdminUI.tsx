import Link from "next/link";
import type { ReactNode } from "react";

type AdminPageProps = { children: ReactNode; className?: string };
type AdminHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children?: ReactNode;
};
type AdminSectionProps = { children: ReactNode; className?: string };

export function AdminPage({ children, className = "" }: AdminPageProps) {
  return <main className={`admin-page-system ${className}`.trim()}>{children}</main>;
}

export function AdminHeader({ eyebrow, title, description, action, children }: AdminHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header-copy">
        {eyebrow ? <span className="admin-page-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="admin-page-header-actions">
        {children}
        {action ? <Link className="admin-button admin-button-primary" href={action.href}>{action.label}</Link> : null}
      </div>
    </header>
  );
}

export function AdminToolbar({ children, className = "" }: AdminSectionProps) {
  return <div className={`admin-toolbar-system ${className}`.trim()}>{children}</div>;
}

export function AdminSection({ children, className = "" }: AdminSectionProps) {
  return <section className={`admin-section-system ${className}`.trim()}>{children}</section>;
}

export function AdminCard({ children, className = "" }: AdminSectionProps) {
  return <article className={`admin-card-system ${className}`.trim()}>{children}</article>;
}
