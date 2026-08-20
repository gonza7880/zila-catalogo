const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

const products = (window.ZILA_PRODUCTS || []).map((p, index) => ({
  ...p,
  id: p.id || p.sku || String(index + 1),
  active: true,
  base_price: Number(p.price || 0),
  sort_order: index + 1,
  product_variants: (p.variants || []).map((v, i) => ({ id: `${p.sku}-v-${i}`, ...v, active: true })),
  product_images: (p.images || []).map((im, i) => ({
    id: `${p.sku}-i-${i}`,
    color: im.color || "",
    image_url: im.url || "",
    image_type: im.type || "",
    sort_order: Number(im.order || i + 1),
    active: true
  }))
}));

let currentVariants = [];
let currentImages = [];

function primaryImage(p) {
  return [...(p.product_images || [])].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))[0]?.image_url || "/logo-zila.jpg";
}

function installPreviewMode() {
  $("loginView").hidden = true;
  $("adminView").hidden = false;
  $("currentUser").textContent = "Vista previa · solo lectura";
  $("newProductBtn").textContent = "Solo lectura";
  $("newProductBtn").disabled = true;
  $("logoutBtn").textContent = "Ir al login real";
  $("logoutBtn").onclick = () => { window.location.href = "https://zila-catalogo.vercel.app/admin"; };

  const banner = document.createElement("div");
  banner.className = "preview-banner";
  banner.innerHTML = "<strong>Vista previa temporal</strong><span>Sin login y sin permisos de escritura. Los datos mostrados provienen del catálogo de respaldo.</span>";
  document.body.appendChild(banner);

  const style = document.createElement("style");
  style.textContent = `
    .preview-banner{position:fixed;left:255px;right:20px;bottom:18px;z-index:90;background:#171614;color:white;border-radius:14px;padding:12px 16px;display:flex;gap:10px;align-items:center;box-shadow:0 12px 35px rgba(0,0,0,.2);font-size:12px}
    .preview-banner span{color:#cfc9c1}.preview-banner strong{white-space:nowrap}
    [disabled]{cursor:not-allowed!important;opacity:.68}
    @media(max-width:850px){.preview-banner{left:20px;right:20px;flex-direction:column;align-items:flex-start}}
  `;
  document.head.appendChild(style);

  $("refreshBtn").onclick = renderProducts;
  $("productSearch").addEventListener("input", renderProducts);
  $("statusFilter").addEventListener("change", renderProducts);
  $("closeProductModal").onclick = closeProductEditor;
  $("cancelProductBtn").onclick = closeProductEditor;
  $("productForm").addEventListener("submit", e => e.preventDefault());

  document.querySelectorAll(".nav-item").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    $("productsView").hidden = view !== "products";
    $("settingsView").hidden = view !== "settings";
    $("pageTitle").textContent = view === "products" ? "Productos" : "Datos del negocio";
    $("newProductBtn").hidden = view !== "products";
  });

  renderStats();
  renderProducts();
  renderSettings();
}

function renderStats() {
  $("statProducts").textContent = products.length;
  $("statActive").textContent = products.length;
  $("statVariants").textContent = products.reduce((a, p) => a + (p.product_variants?.length || 0), 0);
  $("statStock").textContent = products.reduce((a, p) => a + (p.product_variants || []).reduce((s, v) => s + Number(v.stock || 0), 0), 0);
}

function renderProducts() {
  const q = $("productSearch").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const list = products.filter(p => {
    const hay = [p.name, p.sku, p.category, p.subcategory].join(" ").toLowerCase().includes(q);
    return hay && status !== "inactive";
  });

  $("emptyProducts").hidden = list.length > 0;
  $("productsTable").innerHTML = list.map(p => {
    const stock = (p.product_variants || []).reduce((s, v) => s + Number(v.stock || 0), 0);
    return `<tr>
      <td><div class="product-cell"><img class="product-thumb" src="${esc(primaryImage(p))}" alt=""><div><strong>${esc(p.name)}</strong><small>${esc(p.sku)}</small></div></div></td>
      <td>${esc(p.category || "-")}</td>
      <td>${money(p.base_price)}</td>
      <td>${(p.product_variants || []).length}</td>
      <td>${stock}</td>
      <td><span class="status-pill on">Publicado</span></td>
      <td><button class="row-edit" data-edit="${esc(p.id)}">Ver</button></td>
    </tr>`;
  }).join("");

  $("productsTable").querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => openProductEditor(products.find(p => String(p.id) === String(btn.dataset.edit)));
  });
}

function openProductEditor(product) {
  if (!product) return;
  currentVariants = (product.product_variants || []).map(v => ({ ...v }));
  currentImages = (product.product_images || []).map(i => ({ ...i })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  $("productModalTitle").textContent = product.name;
  $("pSku").value = product.sku || "";
  $("pName").value = product.name || "";
  $("pCategory").value = product.category || "";
  $("pSubcategory").value = product.subcategory || "";
  $("pCollection").value = product.collection || "";
  $("pMaterial").value = product.material || "";
  $("pPrice").value = product.base_price ?? "";
  $("pSortOrder").value = product.sort_order ?? "";
  $("pShort").value = product.short || product.short_description || "";
  $("pActive").checked = true;

  $("productForm").querySelectorAll("input, textarea").forEach(el => el.disabled = true);
  $("addVariantBtn").hidden = true;
  $("addImageUrlBtn").hidden = true;
  $("uploadImageBtn").hidden = true;
  $("uploadFile").disabled = true;
  $("uploadColor").disabled = true;
  $("uploadType").disabled = true;
  $("deleteProductBtn").hidden = true;
  $("productForm").querySelector('button[type="submit"]').hidden = true;
  $("cancelProductBtn").textContent = "Cerrar";

  renderVariantsEditor();
  renderImagesEditor();
  $("productModal").classList.add("open");
}

function closeProductEditor() {
  $("productModal").classList.remove("open");
}

function renderVariantsEditor() {
  $("variantsEditor").innerHTML = currentVariants.map(v => `<div class="variant-row">
    <input value="${esc(v.color || "")}" disabled>
    <input value="${esc(v.size ?? "")}" disabled>
    <input value="${esc(v.stock ?? 0)}" disabled>
    <input value="${esc(v.price ?? "")}" disabled>
    <span></span>
  </div>`).join("");
}

function renderImagesEditor() {
  $("imagesEditor").innerHTML = currentImages.map((im, i) => `<div class="image-row">
    <img class="image-preview" src="${esc(im.image_url || "/logo-zila.jpg")}" alt="">
    <input value="${esc(im.image_url || "")}" disabled>
    <input value="${esc(im.color || "")}" disabled>
    <input value="${esc(im.image_type || "")}" disabled>
    <input value="${esc(im.sort_order ?? i + 1)}" disabled>
    <span></span>
  </div>`).join("");
}

function renderSettings() {
  $("settingWhatsapp").value = "+54 9 11 3769-6880";
  $("settingInstagram").value = "@zila.calzados";
  $("settingAddress").value = "Malabia 1918, Palermo Soho";
  $("settingHours").value = "Lunes a viernes · 10 a 19 hs";
  $("settingShipping").value = "Envíos a todo el país";
  $("settingReturns").value = "Vista previa: los datos reales se cargan al iniciar sesión en producción.";
  $("settingsForm").querySelectorAll("input, textarea, button").forEach(el => el.disabled = true);
}

installPreviewMode();
