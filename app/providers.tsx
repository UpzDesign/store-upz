"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";

export default function Providers({ children }: any) {
  const hydrate = useCartStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}