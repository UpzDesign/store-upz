import type { Metadata } from "next";
import Link from "next/link";
import { Montserrat } from "next/font/google";
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
              <Link href="/" className="store-logo">
                <span className="store-logo-main">UPZ</span>
                <span className="store-logo-sub">DESIGN</span>
              </Link>

              <nav className="store-nav" aria-label="Store navigation">
                <a href="/collections/apparel">Apparel</a>
                <a href="/collections/drinkware">Drinkware</a>
                <a href="/collections/office">Office & Accessories</a>
                <a href="/collections/accessories">Signage & Materials</a>
                <a href="/#cre-packages">Broker Packages</a>
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
