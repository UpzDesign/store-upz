const PRINTFUL_API = "https://api.printful.com";

export async function getProducts() {
  const res = await fetch(`${PRINTFUL_API}/store/products`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  const data = await res.json();
  return data.result || [];
}