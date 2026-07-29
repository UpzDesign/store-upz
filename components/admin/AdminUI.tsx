import Link from "next/link";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type CommonProps={children?:ReactNode;className?:string};
const cx=(...values:Array<string|false|null|undefined>)=>values.filter(Boolean).join(" ");

export function AdminPage({children,className}:CommonProps){return <main className={cx("admin-ui-page",className)}>{children}</main>}

export function AdminHeader({eyebrow,title,description,actions,className}:{eyebrow:string;title:string;description?:string;actions?:ReactNode;className?:string}){return <header className={cx("admin-ui-header",className)}><div className="admin-ui-header-copy"><span className="admin-ui-eyebrow">{eyebrow}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="admin-ui-header-actions">{actions}</div>}</header>}

export function AdminStats({children,className}:CommonProps){return <section className={cx("admin-ui-stats",className)}>{children}</section>}
export function StatCard({label,value,className}:{label:string;value:ReactNode;className?:string}){return <article className={cx("admin-ui-stat",className)}><span>{label}</span><strong>{value}</strong></article>}

export function AdminSection({children,className}:CommonProps){return <section className={cx("admin-ui-section",className)}>{children}</section>}
export function AdminSectionHeader({eyebrow,title,actions}:{eyebrow?:string;title:string;actions?:ReactNode}){return <div className="admin-ui-section-header"><div>{eyebrow&&<span className="admin-ui-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{actions&&<div className="admin-ui-section-actions">{actions}</div>}</div>}
export function AdminToolbar({children,className}:CommonProps){return <section className={cx("admin-ui-toolbar",className)}>{children}</section>}
export function AdminGrid({children,className,columns=3}:CommonProps&{columns?:1|2|3|4}){return <div className={cx("admin-ui-grid",`admin-ui-grid--${columns}`,className)}>{children}</div>}
export function AdminCard({children,className,variant="default"}:CommonProps&{variant?:"default"|"highlight"|"outlined"|"compact"}){return <article className={cx("admin-ui-card",`admin-ui-card--${variant}`,className)}>{children}</article>}
export function AdminEmptyState({children,className}:CommonProps){return <div className={cx("admin-ui-empty",className)}>{children}</div>}

export function AdminButton({children,href,variant="primary",className,...buttonProps}:{children:ReactNode;href?:string;variant?:"primary"|"secondary"|"ghost"|"outline"|"danger";className?:string}&ButtonHTMLAttributes<HTMLButtonElement>){const classes=cx("admin-ui-btn",`admin-ui-btn--${variant}`,className);if(href)return <Link className={classes} href={href}>{children}</Link>;return <button className={classes} {...buttonProps}>{children}</button>}

export function AdminTabs({children,className}:CommonProps){return <div className={cx("admin-ui-tabs",className)}>{children}</div>}
export function AdminField({label,children,className}:CommonProps&{label:string}){return <label className={cx("admin-ui-field",className)}><span>{label}</span>{children}</label>}
export function AdminFormGrid({children,className}:CommonProps){return <div className={cx("admin-ui-form-grid",className)}>{children}</div>}
export function AdminNotice({children,className}:CommonProps){return <section className={cx("admin-ui-notice",className)}>{children}</section>}
export function AdminStack({children,className,...props}:CommonProps&HTMLAttributes<HTMLDivElement>){return <div className={cx("admin-ui-stack",className)} {...props}>{children}</div>}
