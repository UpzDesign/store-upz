export async function GET() {
  try {
    const res = await fetch("https://api.printful.com/store/products", {
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
      },
    });

    const text = await res.text();

    console.log("PRINTFUL RESPONSE:", text);

    return new Response(text, { status: 200 });
  } catch (err) {
    console.error("ERROR:", err);

    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
}