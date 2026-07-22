import type { Metadata } from "next";
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
import "./final-polish.css";
import "./workflow-polish.css";
import "./service-list-fix.css";
import "./client-projects.css";
import "./command-palette.css";
import "./service-library.css";
import Providers from "./providers";
import Cart from "@/components/Cart";
import SiteChrome from "@/components/SiteChrome";
import AdminCommandPalette from "@/components/AdminCommandPalette";

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
          <SiteChrome>{children}</SiteChrome>
          <AdminCommandPalette />
          <Cart />
        </Providers>
      </body>
    </html>
  );
}
