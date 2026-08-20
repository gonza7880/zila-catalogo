import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isSupabaseConfigured } from "../supabase-config.js";

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(Number(n)||0);
const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

let products = [];
let editingProduct = null;
let currentImages = [];
let currentVariants = [];

async function boot(){
  if(!isSupabaseConfigured){
    $("configAlert").hidden = false;
    $("loginForm").querySelector("button").disabled = true;
    return;
  }
  const { data:{ session } } = await supabase.auth.getSession();
  if(session) await enterAdmin(session);
}

$("loginForm").addEventListener("submit", async e=>{
  e.preventDefault();
  $("loginError").textContent = "";
  const { data, error } = await supabase.auth.signInWithPassword({
    email: $("loginEmail").value.trim(),
    password: $("loginPassword").value
  });
  if(error){ $("loginError").textContent = "No se pudo iniciar sesión. Revisá email y contraseña."; return; }
  await enterAdmin(data.session);
});

async function enterAdmin(session){
  const { data:isAdmin, error } = await supabase.rpc("is_catalog_admin");
  if(error || !isAdmin){
    await supabase.auth.signOut();
    $("loginError").textContent = "Tu usuario no tiene permisos para administrar este catálogo.";
    return;
  }
  $("loginView").hidden = true;
  $("adminView").hidden = false;
  $("currentUser").textContent = session.user.email || "";
  await Promise.all([loadProducts(), loadSettings()]);
}

$("logoutBtn").onclick = async()=>{ await supabase.auth.signOut(); location.reload(); };
$("refreshBtn").onclick = loadProducts;
$("productSearch").addEventListener("input", renderProducts);
$("statusFilter").addEventListener("change", renderProducts);
$("newProductBtn").onclick = ()=>openProductEditor(null);
$("closeProductModal").onclick = closeProductEditor;
$("cancelProductBtn").onclick = closeProductEditor;
$("addVariantBtn").onclick = ()=>{ currentVariants.push({color:"",size:"",stock:0,price:""}); renderVariantsEditor(); };
$("addImageUrlBtn").onclick = ()=>{ currentImages.push({image_url:"",color:"",image_type:"",sort_order:currentImages.length+1,storage_path:""}); renderImagesEditor(); };
$("uploadImageBtn").onclick = uploadImage;
$("productForm").addEventListener("submit", saveProduct);
$("deleteProductBtn").onclick = deleteProduct;
$("settingsForm").addEventListener("submit", saveSettings);

document.querySelectorAll(".nav-item").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  const view = btn.dataset.view;
  $("productsView").hidden = view !== "products";
  $("settingsView").hidden = view !== "settings";
  $("pageTitle").textContent = view === "products" ? "Productos" : "Datos del negocio";
  $("newProductBtn").hidden = view !== "products";
});

async function loadProducts(){
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_variants(id,color,size,stock,price,active),
      product_images(id,color,image_url,storage_path,alt_text,image_type,sort_order,active)
    `)
    .order("sort_order",{ascending:true})
    .order("name",{ascending:true});

  if(error){ alert("No se pudo cargar el catálogo: "+error.message); return; }
  products = data || [];
  renderProducts();
  renderStats();
}

function renderStats(){
  $("statProducts").textContent = products.length;
  $("statActive").textContent = products.filter(p=>p.active).length;
  $("statVariants").textContent = products.reduce((a,p)=>a+(p.product_variants?.length||0),0);
  $("statStock").textContent = products.reduce((a,p)=>a+(p.product_variants||[]).reduce((s,v)=>s+Number(v.stock||0),0),0);
}

function primaryImage(p){
  return [...(p.product_images||[])].filter(i=>i.active!==false).sort((a,b)=>(a.sort_order||99)-(b.sort_order||99))[0]?.image_url || "../logo-zila.jpg";
}

function renderProducts(){
  const q = $("productSearch").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const list = products.filter(p=>{
    const hay = [p.name,p.sku,p.category,p.subcategory].join(" ").toLowerCase().includes(q);
    const state = status==="all" || (status==="active" && p.active) || (status==="inactive" && !p.active);
    return hay && state;
  });
  $("emptyProducts").hidden = list.length>0;
  $("productsTable").innerHTML = list.map(p=>{
    const stock=(p.product_variants||[]).reduce((s,v)=>s+Number(v.stock||0),0);
    return `<tr>
      <td><div class="product-cell"><img class="product-thumb" src="${esc(primaryImage(p))}" alt=""><div><strong>${esc(p.name)}</strong><small>${esc(p.sku)}</small></div></div></td>
      <td>${esc(p.category||"-")}</td>
      <td>${money(p.base_price)}</td>
      <td>${(p.product_variants||[]).length}</td>
      <td>${stock}</td>
      <td><span class="status-pill ${p.active?"on":"off"}">${p.active?"Publicado":"Pausado"}</span></td>
      <td><button class="row-edit" data-edit="${esc(p.id)}">Editar</button></td>
    </tr>`;
  }).join("");
  $("productsTable").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openProductEditor(products.find(p=>p.id===b.dataset.edit)));
}

function openProductEditor(product){
  editingProduct = product;
  currentVariants = (product?.product_variants || []).map(v=>({...v}));
  currentImages = (product?.product_images || []).map(i=>({...i})).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));

  $("productModalTitle").textContent = product ? `Editar ${product.name}` : "Nuevo producto";
  $("productId").value = product?.id || "";
  $("pSku").value = product?.sku || "";
  $("pName").value = product?.name || "";
  $("pCategory").value = product?.category || "";
  $("pSubcategory").value = product?.subcategory || "";
  $("pCollection").value = product?.collection || "";
  $("pMaterial").value = product?.material || "";
  $("pPrice").value = product?.base_price ?? "";
  $("pSortOrder").value = product?.sort_order ?? products.length+1;
  $("pShort").value = product?.short_description || "";
  $("pActive").checked = product ? product.active !== false : true;
  $("deleteProductBtn").hidden = !product;
  $("productSaveStatus").textContent = "";
  $("uploadStatus").textContent = "";
  renderVariantsEditor();
  renderImagesEditor();
  $("productModal").classList.add("open");
}

function closeProductEditor(){ $("productModal").classList.remove("open"); }

function renderVariantsEditor(){
  $("variantsEditor").innerHTML = currentVariants.map((v,i)=>`<div class="variant-row">
    <input data-v="${i}" data-field="color" value="${esc(v.color||"")}" placeholder="Color">
    <input data-v="${i}" data-field="size" type="number" value="${esc(v.size??"")}" placeholder="Talle">
    <input data-v="${i}" data-field="stock" type="number" min="0" value="${esc(v.stock??0)}" placeholder="Stock">
    <input data-v="${i}" data-field="price" type="number" min="0" value="${esc(v.price??"")}" placeholder="Precio">
    <button type="button" class="mini-remove" data-remove-v="${i}">×</button>
  </div>`).join("");
  $("variantsEditor").querySelectorAll("[data-v]").forEach(inp=>inp.oninput=()=>{ currentVariants[Number(inp.dataset.v)][inp.dataset.field]=inp.value; });
  $("variantsEditor").querySelectorAll("[data-remove-v]").forEach(b=>b.onclick=()=>{ currentVariants.splice(Number(b.dataset.removeV),1); renderVariantsEditor(); });
}

function renderImagesEditor(){
  $("imagesEditor").innerHTML = currentImages.map((im,i)=>`<div class="image-row">
    <img class="image-preview" src="${esc(im.image_url||"../logo-zila.jpg")}" alt="">
    <input data-i="${i}" data-field="image_url" value="${esc(im.image_url||"")}" placeholder="URL imagen">
    <input data-i="${i}" data-field="color" value="${esc(im.color||"")}" placeholder="Color">
    <input data-i="${i}" data-field="image_type" value="${esc(im.image_type||"")}" placeholder="Tipo">
    <input data-i="${i}" data-field="sort_order" type="number" min="1" value="${esc(im.sort_order??i+1)}" title="Orden">
    <button type="button" class="mini-remove" data-remove-i="${i}">×</button>
  </div>`).join("");
  $("imagesEditor").querySelectorAll("[data-i]").forEach(inp=>inp.oninput=()=>{ currentImages[Number(inp.dataset.i)][inp.dataset.field]=inp.value; });
  $("imagesEditor").querySelectorAll("[data-remove-i]").forEach(b=>b.onclick=()=>{ currentImages.splice(Number(b.dataset.removeI),1); renderImagesEditor(); });
}

async function uploadImage(){
  const file=$("uploadFile").files[0];
  if(!file){ $("uploadStatus").textContent="Elegí una imagen."; return; }
  const sku=($("pSku").value.trim()||"sin-sku").replace(/[^a-zA-Z0-9_-]/g,"-").toLowerCase();
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
  const path=`${sku}/${Date.now()}-${safeName}`;
  $("uploadStatus").textContent="Subiendo…";

  const { error } = await supabase.storage.from("zila-products").upload(path,file,{upsert:false,cacheControl:"3600"});
  if(error){ $("uploadStatus").textContent="Error: "+error.message; return; }

  const { data } = supabase.storage.from("zila-products").getPublicUrl(path);
  currentImages.push({ image_url:data.publicUrl, storage_path:path, color:$("uploadColor").value.trim(), image_type:$("uploadType").value.trim(), sort_order:currentImages.length+1, active:true });
  $("uploadFile").value="";
  $("uploadStatus").textContent="Imagen subida.";
  renderImagesEditor();
}

async function saveProduct(e){
  e.preventDefault();
  $("productSaveStatus").textContent="Guardando…";

  const payload={
    sku:$("pSku").value.trim().toUpperCase(),
    name:$("pName").value.trim(),
    category:$("pCategory").value.trim(),
    subcategory:$("pSubcategory").value.trim(),
    collection:$("pCollection").value.trim(),
    short_description:$("pShort").value.trim(),
    material:$("pMaterial").value.trim(),
    base_price:Number($("pPrice").value||0),
    sort_order:Number($("pSortOrder").value||0),
    active:$("pActive").checked
  };

  let productId=$("productId").value;
  let result = productId ? await supabase.from("products").update(payload).eq("id",productId).select().single() : await supabase.from("products").insert(payload).select().single();
  if(result.error){ $("productSaveStatus").textContent="Error: "+result.error.message; return; }
  productId=result.data.id;

  let d1=await supabase.from("product_variants").delete().eq("product_id",productId);
  if(d1.error){ $("productSaveStatus").textContent="Error variantes: "+d1.error.message; return; }

  const variantRows=currentVariants.filter(v=>String(v.color||"").trim() && String(v.size||"").trim()).map(v=>({
    product_id:productId,color:String(v.color).trim(),size:Number(v.size),stock:Number(v.stock||0),price:v.price===""||v.price==null?payload.base_price:Number(v.price),active:true
  }));
  if(variantRows.length){ const ins=await supabase.from("product_variants").insert(variantRows); if(ins.error){ $("productSaveStatus").textContent="Error variantes: "+ins.error.message; return; } }

  let d2=await supabase.from("product_images").delete().eq("product_id",productId);
  if(d2.error){ $("productSaveStatus").textContent="Error imágenes: "+d2.error.message; return; }

  const imageRows=currentImages.filter(i=>String(i.image_url||"").trim()).map((i,index)=>({
    product_id:productId,image_url:String(i.image_url).trim(),storage_path:i.storage_path||null,color:String(i.color||"").trim(),image_type:String(i.image_type||"").trim(),sort_order:Number(i.sort_order||index+1),active:true
  }));
  if(imageRows.length){ const ins=await supabase.from("product_images").insert(imageRows); if(ins.error){ $("productSaveStatus").textContent="Error imágenes: "+ins.error.message; return; } }

  $("productSaveStatus").textContent="Producto guardado.";
  await loadProducts();
  setTimeout(closeProductEditor,450);
}

async function deleteProduct(){
  if(!editingProduct) return;
  if(!confirm(`¿Eliminar ${editingProduct.name}? Esta acción no se puede deshacer.`)) return;
  const { error }=await supabase.from("products").delete().eq("id",editingProduct.id);
  if(error){ $("productSaveStatus").textContent="Error: "+error.message; return; }
  await loadProducts(); closeProductEditor();
}

async function loadSettings(){
  const {data,error}=await supabase.from("store_settings").select("*").eq("id",1).maybeSingle();
  if(error) return;
  $("settingWhatsapp").value=data?.whatsapp||"+54 9 11 3769-6880";
  $("settingInstagram").value=data?.instagram||"@zila.calzados";
  $("settingAddress").value=data?.address||"Malabia 1918, Palermo Soho";
  $("settingHours").value=data?.opening_hours||"Lunes a viernes · 10 a 19 hs";
  $("settingShipping").value=data?.shipping_text||"Envíos a todo el país";
  $("settingReturns").value=data?.returns_policy||"";
}

async function saveSettings(e){
  e.preventDefault();
  $("settingsStatus").textContent="Guardando…";
  const {error}=await supabase.from("store_settings").upsert({ id:1, whatsapp:$("settingWhatsapp").value.trim(), instagram:$("settingInstagram").value.trim(), address:$("settingAddress").value.trim(), opening_hours:$("settingHours").value.trim(), shipping_text:$("settingShipping").value.trim(), returns_policy:$("settingReturns").value.trim() });
  $("settingsStatus").textContent=error?"Error: "+error.message:"Datos guardados.";
}

boot();
