const IMAGES = {
  plata: "https://drive.google.com/thumbnail?id=14XmNKxGNWjGziy9Np6RTLHpzP1aiv5Wv&sz=w1600",
  dorado: "https://drive.google.com/thumbnail?id=11MW3uCEnQNEbCxk8Fycn52h_oSrmYryw&sz=w1600"
};

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method Not Allowed");
  }

  const color = String(req.query.color || "").toLowerCase();
  const source = IMAGES[color];

  if (!source) {
    return res.status(404).send("Image not found");
  }

  try {
    const upstream = await fetch(source, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!upstream.ok) {
      throw new Error(`Upstream image error: ${upstream.status}`);
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");
    res.setHeader("X-Robots-Tag", "noindex");

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    return res.status(200).send(body);
  } catch (error) {
    console.error("Pietra image proxy error", error);
    return res.status(502).send("Image unavailable");
  }
};
