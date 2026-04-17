import Providers from "./providers";
import Cart from "@/components/Cart";

export default function RootLayout({ children }: any) {
  return (
    <html>
      <body>
        {children}
        <Cart />
      </body>
    </html>
  );
}