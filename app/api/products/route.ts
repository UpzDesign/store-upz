import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://api.printful.com/store/products", {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
  });

  const data = await res.json();

  return NextResponse.json(data.result); // ✅ IMPORTANT FIX
}