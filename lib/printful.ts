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

export async function getProductById(id: string) {
  const res = await fetch(`${PRINTFUL_API}/store/products/${id}`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  const data = await res.json();
  return data.result || null;
}