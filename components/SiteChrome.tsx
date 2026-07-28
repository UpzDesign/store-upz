"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/admin") || pathname.startsWith("/portal") || pathname === "/login";
  const portalParts = pathname.split("/").filter(Boolean);
  const portalSlug = portalParts[0] === "portal" ? portalParts[1] : null;
  const showPortalNavigation = Boolean(portalSlug);

  return (
    <>
      {!isWorkspace && (
        <header className="store-header">
          <div className="store-header-inner">
            <Link href="/" className="store-logo" aria-label="UPZ Design Store">
              <img src="/upz-logo.svg" alt="UPZ Design" />
            </Link>
            <nav className="store-nav" aria-label="Store navigation">
              <a href="/collections/apparel">Apparel</a>
              <a href="/collections/drinkware">Drinkware</a>
              <a href="/collections/office">Office</a>
              <a href="/collections/accessories">Accessories</a>
              <a href="/#cre-packages">Broker Packages</a>
              <a href="/#products">All Products</a>
            </nav>
          </div>
        </header>
      )}

      {showPortalNavigation && (
        <nav className="portal-workspace-nav" aria-label="Client workspace navigation">
          <Link className={pathname === `/portal/${portalSlug}` ? "is-active" : ""} href={`/portal/${portalSlug}`}>
            Portal Home
          </Link>
          <Link className={pathname.includes("/projects") ? "is-active" : ""} href={`/portal/${portalSlug}/projects`}>
            Project Updates
          </Link>
          <Link className={pathname.includes("/deliverables") ? "is-active" : ""} href={`/portal/${portalSlug}/deliverables`}>
            Deliverables
          </Link>
        </nav>
      )}

      {children}

      <footer className="upz-powered-footer">
        <a href="https://www.upzdesign.com" target="_blank" rel="noreferrer" aria-label="Powered by UPZ Design">
          <span>Powered by</span>
          <img src="/upz-logo.svg" alt="UPZ Design" />
        </a>
      </footer>
    </>
  );
}
