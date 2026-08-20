import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isSupabaseConfigured } from "./supabase-config.js";

async function loadCatalog(){
  if(!isSupabaseConfigured) return;

  try{
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        sku,
        name,
        category,
        subcategory,
        collection,
        short_description,
        material,
        base_price,
        active,
        sort_order,
        product_variants (
          id,
          color,
          size,
          stock,
          price,
          active
        ),
        product_images (
          id,
          color,
          image_url,
          alt_text,
          image_type,
          sort_order,
          active
        )
      `)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if(error) throw error;

    PRODUCTS = (data || []).map(row => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      category: row.category || "",
      subcategory: row.subcategory || "",
      collection: row.collection || "",
      short: row.short_description || "",
      material: row.material || "",
      price: Number(row.base_price || 0),
      variants: (row.product_variants || [])
        .filter(v => v.active !== false)
        .map(v => ({
          id: v.id,
          color: v.color,
          size: Number(v.size),
          stock: Number(v.stock || 0),
          price: Number(v.price ?? row.base_price ?? 0)
        }))
        .sort((a,b) => String(a.color).localeCompare(String(b.color)) || a.size - b.size),
      images: (row.product_images || [])
        .filter(i => i.active !== false)
        .map(i => ({
          id: i.id,
          color: i.color || "",
          url: i.image_url,
          type: i.image_type || "",
          order: Number(i.sort_order || 0)
        }))
        .sort((a,b) => a.order - b.order)
    }));

    console.info(`ZILA: catálogo online cargado (${PRODUCTS.length} productos).`);
  }catch(error){
    console.error("ZILA: no se pudo cargar Supabase; se usa el catálogo de respaldo.", error);
  }
}

const money = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(Number(n)||0);
const norm = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const $ = id => document.getElementById(id);

let PRODUCTS = window.ZILA_PRODUCTS || [];
let category = "Todos";
let search = "";
let activeProduct = null;
let selectedColor = null;
let selectedSize = null;
let bag = JSON.parse(sessionStorage.getItem("zila_bag")||"[]");

async function init(){
  await loadCatalog();
  renderFilters(); renderProducts(); renderBag();
  $("searchInput").addEventListener("input",e=>{search=e.target.value.trim();renderProducts()});
  $("filters").addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(!b)return;category=b.dataset.cat;renderFilters();renderProducts()});
  $("products").addEventListener("click",e=>{const b=e.target.closest("[data-sku]");if(!b)return;openProduct(b.dataset.sku)});
  $("clearFilters").addEventListener("click",()=>{category="Todos";search="";$("searchInput").value="";renderFilters();renderProducts()});
  $("closeProductModal").onclick=()=>closeModal("productModal");
  $("closeBagModal").onclick=()=>closeModal("bagModal");
  $("openBag").onclick=openBag;
  $("openBagTop").onclick=openBag;
  $("openSizeGuideTop").onclick=openSizeGuide;
  $("openSizeGuideCard").onclick=openSizeGuide;
  $("openSizeGuideCard").onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openSizeGuide()}};
  $("openSizeGuideProduct").onclick=openSizeGuide;
  $("openSizeGuideFooter").onclick=openSizeGuide;
  $("closeSizeGuideModal").onclick=()=>closeModal("sizeGuideModal");
  $("addToBag").onclick=addToBag;
  $("sendWhatsapp").onclick=sendWhatsapp;
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal("productModal");closeModal("bagModal");closeModal("sizeGuideModal")}});
  document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));
}
function renderFilters(){
  const cats=["Todos",...new Set(PRODUCTS.map(p=>p.category).filter(Boolean))];
  $("filters").innerHTML=cats.map(c=>`<button class="filter-btn ${c===category?"active":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
}
function filtered(){
  return PRODUCTS.filter(p=>{
    const catOk=category==="Todos"||p.category===category;
    const hay=norm([p.name,p.sku,p.category,p.subcategory,p.short,p.material].join(" ")).includes(norm(search));
    return catOk&&hay;
  });
}
function primaryImage(p){
  return [...p.images].sort((a,b)=>(a.order||99)-(b.order||99))[0]?.url||"";
}
function renderProducts(){
  const list=filtered(); $("resultCount").textContent=list.length; $("emptyState").hidden=list.length>0;
  $("products").innerHTML=list.map(p=>`<article class="product-card">
    <button class="product-image" data-sku="${esc(p.sku)}" aria-label="Ver ${esc(p.name)}"><img src="${esc(primaryImage(p))}" alt="${esc(p.name)}" loading="lazy"></button>
    <div class="product-body">
      <span class="product-cat">${esc(p.category)}</span>
      <h3 class="product-title">${esc(p.name)}</h3>
      <p class="product-desc">${esc(p.short)}</p>
      <div class="product-bottom"><span class="price">${money(p.price)}</span><button class="view-btn" data-sku="${esc(p.sku)}">Ver opciones</button></div>
    </div></article>`).join("");
}
function openProduct(sku){
  activeProduct=PRODUCTS.find(p=>p.sku===sku); if(!activeProduct)return;
  const colors=[...new Set(activeProduct.variants.filter(v=>v.stock>0).map(v=>v.color))];
  selectedColor=colors[0]||null; selectedSize=null;
  $("detailName").textContent=activeProduct.name;
  $("detailCategory").textContent=activeProduct.category;
  $("detailDescription").textContent=activeProduct.short;
  $("detailMaterial").textContent=[activeProduct.material,activeProduct.collection].filter(Boolean).join(" · ");
  $("detailPrice").textContent=money(activeProduct.price);
  renderColorOptions(); renderSizeOptions(); renderGallery();
  $("productModal").classList.add("open");
}
function renderColorOptions(){
  const colors=[...new Set(activeProduct.variants.filter(v=>v.stock>0).map(v=>v.color))];
  $("colorOptions").innerHTML=colors.map(c=>`<button class="option-pill ${c===selectedColor?"active":""}" data-color="${esc(c)}">${esc(c)}</button>`).join("");
  $("colorOptions").querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>{selectedColor=b.dataset.color;selectedSize=null;renderColorOptions();renderSizeOptions();renderGallery()});
}
function renderSizeOptions(){
  const sizes=[...new Set(activeProduct.variants.filter(v=>v.color===selectedColor).map(v=>v.size))].sort((a,b)=>a-b);
  $("sizeOptions").innerHTML=sizes.map(s=>{const v=activeProduct.variants.find(v=>v.color===selectedColor&&String(v.size)===String(s));return `<button class="option-pill ${String(s)===String(selectedSize)?"active":""}" data-size="${s}" ${!v||v.stock<=0?"disabled":""}>${s}</button>`}).join("");
  $("sizeOptions").querySelectorAll("[data-size]").forEach(b=>b.onclick=()=>{selectedSize=b.dataset.size;renderSizeOptions();updateStockHint()});
  updateStockHint();
}
function updateStockHint(){
  const v=activeProduct?.variants.find(v=>v.color===selectedColor&&String(v.size)===String(selectedSize));
  $("addToBag").disabled=!v||v.stock<=0;
  $("stockHint").textContent=!selectedSize?"Elegí un talle disponible.":v?.stock<=2?"Últimos pares disponibles.":"Disponible.";
}
function renderGallery(){
  let imgs=activeProduct.images.filter(i=>norm(i.color)===norm(selectedColor));
  if(!imgs.length)imgs=activeProduct.images;
  imgs=[...imgs].sort((a,b)=>(a.order||99)-(b.order||99));
  if(!imgs.length)return;
  $("detailMainImage").src=imgs[0].url; $("detailMainImage").alt=activeProduct.name;
  $("detailThumbs").innerHTML=imgs.map((im,i)=>`<button class="thumb ${i===0?"active":""}" data-img="${esc(im.url)}"><img src="${esc(im.url)}" alt=""></button>`).join("");
  $("detailThumbs").querySelectorAll("[data-img]").forEach(b=>b.onclick=()=>{$("detailMainImage").src=b.dataset.img;$("detailThumbs").querySelectorAll(".thumb").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
}
function addToBag(){
  const v=activeProduct.variants.find(v=>v.color===selectedColor&&String(v.size)===String(selectedSize)); if(!v)return;
  const key=`${activeProduct.sku}|${selectedColor}|${selectedSize}`;
  const existing=bag.find(x=>x.key===key);
  if(existing){if(existing.qty<v.stock)existing.qty++} else bag.push({key,sku:activeProduct.sku,name:activeProduct.name,color:selectedColor,size:selectedSize,qty:1,price:Number(v.price||activeProduct.price),image:primaryImage(activeProduct),stock:v.stock});
  saveBag(); renderBag(); closeModal("productModal");
}
function saveBag(){sessionStorage.setItem("zila_bag",JSON.stringify(bag))}
function renderBag(){
  const count=bag.reduce((a,x)=>a+x.qty,0), total=bag.reduce((a,x)=>a+x.qty*x.price,0);
  $("bagCount").textContent=`${count} ${count===1?"producto":"productos"}`;$("bagCountTop").textContent=count;$("bagTotal").textContent=money(total);$("openBag").disabled=count===0;
}
function openSizeGuide(){
  $("sizeGuideModal").classList.add("open");
}
function openBag(){
  if(!bag.length)return;
  renderBagItems(); $("bagModal").classList.add("open");
}
function renderBagItems(){
  $("bagItems").innerHTML=bag.map((x,i)=>`<div class="bag-item"><img src="${esc(x.image)}" alt=""><div><h4>${esc(x.name)}</h4><p>${esc(x.color)} · Talle ${esc(x.size)} · ${x.qty} u. · ${money(x.price*x.qty)}</p></div><button class="remove-item" data-remove="${i}">Quitar</button></div>`).join("");
  $("bagItems").querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{bag.splice(Number(b.dataset.remove),1);saveBag();renderBag();if(bag.length)renderBagItems();else closeModal("bagModal")});
  $("checkoutTotal").textContent=money(bag.reduce((a,x)=>a+x.qty*x.price,0));
}
function sendWhatsapp(){
  const name=$("customerName").value.trim(), phone=$("customerPhone").value.trim();
  if(!name||!phone){alert("Completá nombre y teléfono.");return}
  const total=bag.reduce((a,x)=>a+x.qty*x.price,0);
  const items=bag.map(x=>`• ${x.name} - ${x.color} - Talle ${x.size} x${x.qty} (${money(x.price*x.qty)})`).join("\n");
  const msg=`Hola ZILA, quiero consultar disponibilidad de:\n\n${items}\n\nTotal estimado: ${money(total)}\n\nNombre: ${name}\nTeléfono: ${phone}\nEntrega: ${$("deliveryType").value}\nLocalidad: ${$("customerLocation").value.trim()||"-"}\nAclaraciones: ${$("customerNotes").value.trim()||"-"}\n\nSé que la disponibilidad, envío y forma de pago se confirman por este medio.`;
  const number="5491137696880";
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
}
function closeModal(id){$(id).classList.remove("open")}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
init();
