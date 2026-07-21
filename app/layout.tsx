import type { Metadata } from "next";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "./portal-responsive.css";
import "./portal-requests.css";
import "./admin.css";
import "./admin-forms.css";
import "./admin-requests.css";
import "./packages.css";
import "./projects.css";
import "./ui-polish.css";
import "./client-portal-polish.css";
import Providers from "./providers";
import Cart from "@/components/Cart";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UPZ Store | Branded Merchandise & CRE Packages",
  description:
    "Branded merchandise, promotional products, and curated CRE packages by UPZ Design.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <Providers>
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
          {children}
          <Cart />
        </Providers>
      </body>
    </html>
  );
}
