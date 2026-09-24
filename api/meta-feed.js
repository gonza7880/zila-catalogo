const SUPABASE_URL = process.env.SUPABASE_URL || "https://osgyqglcdjwvxbmegumr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_bMORbgecRHsTaUVQTBNpAA_6mKJJk1Q";
const STORE_URL = (process.env.CATALOG_BASE_URL || "https://zila.com.ar").replace(/\/$/, "");

function csvCell(value) {
  const text = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function primaryImage(product) {
  return (product.product_images || [])
    .filter(image => image.active !== false && image.image_url)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))[0]?.image_url || "";
}

function totalStock(product) {
  return (product.product_variants || [])
    .filter(variant => variant.active !== false)
    .reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
}

function buildDescription(product) {
  return [
    product.short_description,
    product.material ? `Material: ${product.material}` : "",
    product.collection ? `Colección: ${product.collection}` : ""
  ].filter(Boolean).join(" · ");
}

module.exports = async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const params = new URLSearchParams({
      select: "sku,name,category,subcategory,collection,short_description,material,base_price,sort_order,product_variants(color,size,stock,price,active),product_images(color,image_url,sort_order,active)",
      active: "eq.true",
      order: "sort_order.asc,name.asc"
    });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?${params.toString()}`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY
      }
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase ${response.status}: ${detail.slice(0, 300)}`);
    }

    const products = await response.json();
    const columns = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
      "product_type",
      "material",
      "custom_label_0"
    ];

    const rows = products
      .filter(product => product.sku && product.name && Number(product.base_price) > 0 && primaryImage(product))
      .map(product => {
        const stock = totalStock(product);
        const link = `${STORE_URL}/?producto=${encodeURIComponent(product.sku)}&utm_source=meta&utm_medium=catalogo&utm_campaign=catalogo_zila`;
        return [
          product.sku,
          product.name,
          buildDescription(product),
          stock > 0 ? "in stock" : "out of stock",
          "new",
          `${Number(product.base_price).toFixed(2)} ARS`,
          link,
          primaryImage(product),
          "ZILA",
          [product.category, product.subcategory].filter(Boolean).join(" > "),
          product.material || "",
          product.collection || ""
        ].map(csvCell).join(",");
      });

    const csv = [columns.map(csvCell).join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="zila-meta-catalog.csv"');
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    return res.status(200).send(req.method === "HEAD" ? "" : csv);
  } catch (error) {
    console.error("ZILA meta feed error", error);
    return res.status(500).json({ error: "No se pudo generar el catálogo de Meta." });
  }
};
