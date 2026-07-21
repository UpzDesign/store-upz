"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/admin") || pathname.startsWith("/portal") || pathname === "/login";

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
