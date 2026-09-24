const track = (eventName, params = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
};

const metaTrack = (eventName, params = {}) => {
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, params);
  }
};

const text = selector => document.querySelector(selector)?.textContent?.trim() || "";

const parseArs = value => {
  const normalized = String(value || "").replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

let lastProductSku = "";
let searchTimer = null;

function currentItem() {
  const color = text("#colorOptions .option-pill.active");
  const size = text("#sizeOptions .option-pill.active");
  return {
    item_id: lastProductSku || text("#detailName"),
    item_name: text("#detailName"),
    item_category: text("#detailCategory"),
    item_variant: [color && `Color: ${color}`, size && `Talle: ${size}`].filter(Boolean).join(" | "),
    price: parseArs(text("#detailPrice")),
    quantity: 1
  };
}

function currentBag() {
  try {
    return JSON.parse(sessionStorage.getItem("zila_bag") || "[]");
  } catch {
    return [];
  }
}

function currentCartValue() {
  return parseArs(text("#bagTotal") || text("#checkoutTotal"));
}

function metaCartParams() {
  const bag = currentBag();
  return {
    content_ids: bag.map(item => String(item.sku || "")).filter(Boolean),
    content_type: "product",
    contents: bag.map(item => ({
      id: String(item.sku || ""),
      quantity: Number(item.qty || 1),
      item_price: Number(item.price || 0)
    })).filter(item => item.id),
    num_items: bag.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    value: bag.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    currency: "ARS"
  };
}

document.addEventListener("zila:view_item", event => {
  const detail = event.detail || {};
  lastProductSku = String(detail.sku || "");

  const item = {
    item_id: lastProductSku,
    item_name: detail.name || "",
    item_category: detail.category || "",
    price: Number(detail.price || 0),
    quantity: 1
  };

  track("view_item", {
    currency: "ARS",
    value: item.price,
    items: [item]
  });

  metaTrack("ViewContent", {
    content_ids: [item.item_id],
    content_type: "product",
    content_name: item.item_name,
    content_category: item.item_category,
    value: item.price,
    currency: "ARS"
  });
});

document.addEventListener("click", event => {
  const categoryButton = event.target.closest("#filters [data-cat]");
  if (categoryButton) {
    track("select_category", {
      category: categoryButton.dataset.cat || ""
    });
  }

  if (event.target.closest("#addToBag") && !event.target.closest("#addToBag")?.disabled) {
    const item = currentItem();

    track("add_to_cart", {
      currency: "ARS",
      value: item.price,
      items: [item]
    });

    metaTrack("AddToCart", {
      content_ids: [item.item_id],
      content_type: "product",
      content_name: item.item_name,
      content_category: item.item_category,
      value: item.price,
      currency: "ARS"
    });
  }

  if (event.target.closest("#openBag, #openBagTop")) {
    track("view_cart", {
      currency: "ARS",
      value: currentCartValue()
    });

    const cart = metaCartParams();
    if (cart.content_ids.length) {
      metaTrack("InitiateCheckout", cart);
    }
  }

  if (event.target.closest("#openSizeGuideTop, #openSizeGuideCard, #openSizeGuideProduct, #openSizeGuideFooter")) {
    track("view_size_guide", {
      location: event.target.closest("#openSizeGuideProduct") ? "product" : "site"
    });
  }

  const instagramLink = event.target.closest('a[href*="instagram.com"]');
  if (instagramLink) {
    track("click_instagram", {
      link_url: instagramLink.href,
      link_text: (instagramLink.textContent || instagramLink.getAttribute("aria-label") || "Instagram").trim()
    });
  }

  const whatsappLink = event.target.closest('a[href*="wa.me"]');
  if (whatsappLink) {
    track("click_whatsapp", {
      source: whatsappLink.classList.contains("size-whatsapp") ? "size_guide" : "footer",
      link_url: whatsappLink.href
    });
    metaTrack("Contact", {
      content_name: "WhatsApp ZILA"
    });
  }

  if (event.target.closest("#sendWhatsapp")) {
    const name = document.getElementById("customerName")?.value.trim();
    const phone = document.getElementById("customerPhone")?.value.trim();
    if (!name || !phone) return;

    const value = currentCartValue();

    track("generate_lead", {
      currency: "ARS",
      value,
      lead_source: "whatsapp_catalog"
    });

    track("click_whatsapp", {
      source: "checkout",
      value,
      currency: "ARS"
    });

    const cart = metaCartParams();
    metaTrack("Lead", {
      ...cart,
      content_name: "Consulta por WhatsApp"
    });
  }
});

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", event => {
    const searchTerm = event.target.value.trim();
    window.clearTimeout(searchTimer);
    if (searchTerm.length < 2) return;

    searchTimer = window.setTimeout(() => {
      track("search", { search_term: searchTerm });
      metaTrack("Search", { search_string: searchTerm });
    }, 700);
  });
}
