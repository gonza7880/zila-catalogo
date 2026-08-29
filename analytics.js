const track = (eventName, params = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
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

function currentCartValue() {
  return parseArs(text("#bagTotal") || text("#checkoutTotal"));
}

document.addEventListener("click", event => {
  const productTrigger = event.target.closest("#products [data-sku]");
  if (productTrigger) {
    lastProductSku = productTrigger.dataset.sku || "";
    window.setTimeout(() => {
      const item = currentItem();
      track("view_item", {
        currency: "ARS",
        value: item.price,
        items: [item]
      });
    }, 0);
  }

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
  }

  if (event.target.closest("#openBag, #openBagTop")) {
    track("view_cart", {
      currency: "ARS",
      value: currentCartValue()
    });
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
    }, 700);
  });
}
