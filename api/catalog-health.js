export default async function handler(req, res) {
  const url = "https://osgyqglcdjwvvxbmegumr.supabase.co/rest/v1/products?select=id,sku,name,active&active=eq.true";
  const key = "sb_publishable_bMORbgecRHsTaUVQTBNpAA_6mKJJk1Q";

  try {
    const response = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}

    res.status(response.ok ? 200 : 502).json({
      ok: response.ok,
      status: response.status,
      count: Array.isArray(data) ? data.length : null,
      sample: Array.isArray(data) ? data.slice(0, 3) : null,
      error: response.ok ? null : text
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
}
