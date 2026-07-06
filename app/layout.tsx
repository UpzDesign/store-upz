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
            <div className="container store-header-inner">
              <Link href="/" className="store-logo">
                <span className="store-logo-mark">U</span>
                <span>UPZ Store</span>
              </Link>

              <nav className="store-nav" aria-label="Store navigation">
                <a href="/#cre-packages">Packages</a>
                <a href="/#products">Products</a>
                <a href="https://www.upzdesign.com/" target="_blank" className="upz-link">
                  UPZDesign.com
                </a>
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
