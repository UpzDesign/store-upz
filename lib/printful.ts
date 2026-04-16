const PRINTFUL_API = "https://api.printful.com";

export async function getProducts() {
  const res = await fetch(`${PRINTFUL_API}/store/products`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Printful products");
  }

  const data = await res.json();
  return data.result;
}