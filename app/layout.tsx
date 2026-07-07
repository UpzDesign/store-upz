import type { Metadata } from "next";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Cart from "@/components/Cart";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const upzLogo = `url('data:image/svg+xml,<%3Fxml version="1.0" encoding="utf-8"%3F><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 45.2 45.5" style="enable-background:new 0 0 45.2 45.5;" xml:space="preserve"><style type="text/css">.st0{stroke:%23000000;stroke-width:0.2835;}.st1{fill:%23EEC02E;stroke:%23EEC02E;stroke-width:0.2835;}</style><g><path class="st0" d="M5.5,10.6C4,10.6,2.8,10.2,2,9.4s-1.2-2-1.2-3.5V0.3h2.8v5.5c0,0.8,0.2,1.5,0.5,1.8C4.5,8,5,8.2,5.6,8.2S6.6,8,7,7.6c0.3-0.4,0.5-1,0.5-1.8V0.3h2.8v5.6c0,1.5-0.4,2.6-1.3,3.4C8.2,10.1,7,10.6,5.5,10.6z"/></g><path class="st0" d="M26.8,2.1c-0.4-0.6-0.9-1-1.5-1.3s-1.5-0.4-2.4-0.4h-4.6v10.1h2.9V7.8h1.7c0.9,0,1.7-0.2,2.4-0.4s1.2-0.7,1.5-1.3c0.4-0.6,0.5-1.2,0.5-2S27.1,2.7,26.8,2.1z M24,5.2c-0.3,0.2-0.7,0.4-1.3,0.4h-1.6v-3h1.6c0.6,0,1,0.1,1.3,0.4s0.5,0.6,0.5,1.1S24.3,4.9,24,5.2z"/><polygon class="st0" points="39.2,8.2 44.3,2.2 44.3,0.4 35.6,0.4 35.6,2.6 40.5,2.6 35.5,8.7 35.5,10.5 44.5,10.5 44.5,8.2 "/><g><path class="st0" d="M0.4,27.4v-10h4.8c1.1,0,2.1,0.2,2.9,0.6s1.5,1,2,1.7s0.7,1.6,0.7,2.7c0,1-0.2,1.9-0.7,2.7c-0.5,0.8-1.1,1.3-2,1.8c-0.8,0.4-1.8,0.6-2.9,0.6C5.1,27.4,0.4,27.4,0.4,27.4z M3.2,25.1H5c0.6,0,1.1-0.1,1.5-0.3s0.8-0.5,1-1c0.2-0.4,0.4-0.9,0.4-1.5s-0.1-1.1-0.4-1.5c-0.2-0.4-0.6-0.7-1-0.9c-0.4-0.2-0.9-0.3-1.5-0.3H3.2V25.1z"/></g><polygon class="st0" points="21.5,25.2 21.5,23.4 26,23.4 26,21.2 21.5,21.2 21.5,19.6 26.6,19.6 26.6,17.4 18.8,17.4 18.8,27.4 26.8,27.4 26.8,25.2 "/><g><path class="st0" d="M39.9,27.6c-0.8,0-1.6-0.1-2.4-0.3c-0.8-0.2-1.4-0.5-1.8-0.8l0.9-2.1c0.5,0.3,1,0.5,1.6,0.7s1.2,0.3,1.8,0.3c0.4,0,0.7,0,1-0.1c0.2-0.1,0.4-0.2,0.5-0.3c0.1-0.1,0.2-0.3,0.2-0.5s-0.1-0.4-0.3-0.5s-0.5-0.2-0.8-0.3s-0.7-0.2-1.1-0.3s-0.8-0.2-1.2-0.3c-0.4-0.1-0.8-0.3-1.1-0.5s-0.6-0.5-0.8-0.9s-0.3-0.8-0.3-1.3c0-0.6,0.2-1.1,0.5-1.6s0.8-0.9,1.5-1.2s1.5-0.5,2.5-0.5c0.7,0,1.3,0.1,2,0.2s1.2,0.4,1.7,0.7l-0.9,2.1c-0.5-0.3-1-0.5-1.4-0.6c-0.5-0.1-0.9-0.2-1.4-0.2c-0.4,0-0.7,0-1,0.1s-0.4,0.2-0.5,0.3s-0.2,0.3-0.2,0.4c0,0.2,0.1,0.4,0.3,0.5s0.5,0.2,0.8,0.3s0.7,0.2,1.1,0.2s0.8,0.2,1.2,0.3c0.4,0.1,0.8,0.3,1.1,0.5s0.6,0.5,0.8,0.9s0.3,0.8,0.3,1.3c0,0.6-0.2,1.1-0.5,1.6s-0.8,0.9-1.5,1.2C41.7,27.5,40.9,27.6,39.9,27.6z"/></g><g><path class="st1" d="M1,42.3l7.1-7.1l2,2L3,44.3L1,42.3z"/></g><path class="st0" d="M25,42.3c-0.1,0-0.2,0.1-0.3,0.1c-0.4,0.1-0.8,0.2-1.2,0.2s-0.8-0.1-1.2-0.2s-0.6-0.3-0.9-0.6c-0.2-0.2-0.4-0.6-0.6-0.9s-0.2-0.7-0.2-1.2c0-0.4,0.1-0.8,0.2-1.2s0.3-0.7,0.6-0.9s0.5-0.5,0.9-0.6s0.8-0.2,1.2-0.2c0.5,0,0.9,0.1,1.3,0.3s0.8,0.5,1.1,0.8l1.8-1.6c-0.5-0.6-1.1-1-1.9-1.4s-1.6-0.5-2.5-0.5c-0.8,0-1.6,0.1-2.3,0.4s-1.3,0.6-1.8,1.1s-0.9,1-1.2,1.7c-0.3,0.6-0.4,1.3-0.4,2.1s0.1,1.5,0.4,2.1s0.7,1.2,1.2,1.7s1.1,0.8,1.8,1.1c0.7,0.2,1.4,0.4,2.2,0.4c0.7,0,1.5-0.1,2.2-0.3s1.4-0.5,2-1v-4.2H25V42.3z"/><polygon class="st0" points="42,34.7 42,40.1 37.5,34.7 35.2,34.7 35.2,44.8 38,44.8 38,39.4 42.4,44.8 44.8,44.8 44.8,34.7 "/></svg>')`;

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
                <span
                  aria-hidden="true"
                  style={{
                    display: "block",
                    width: 46,
                    height: 46,
                    backgroundImage: upzLogo,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                  }}
                />
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
