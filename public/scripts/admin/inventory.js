let separator, detailCard, currentProduct, accounts;
async function inventoryStart() {
  loadInventory(true, true);
}
window._INV_DATA = { products: [], categories: [], accounts: [] };

async function loadInventory(intro, newData) {
  separator = document.getElementById("stock-separator");
  const searchInput = document.getElementById("inventory-search");
  const filterSelect = document.getElementById("inventory-filter");
  const refreshBtn = document.getElementById("inventory-refresh");

  // bind controls only once
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.addEventListener("input", () => loadInventory(false));
    filterSelect.addEventListener("change", () => loadInventory(false));
    refreshBtn.addEventListener("click", async () => {
      setLoading(refreshBtn, true);
      await loadInventory(true, true);
      setLoading(refreshBtn, false);
    });
    searchInput.dataset.bound = "1";
  }
  if (intro) {
    const inventoryCard = document.getElementById("inventory-card");
    inventoryCard.innerHTML = `<div class="loading-holder"><div class="loader2"></div><h4>Loading Inventory</h4></div>`;
  }
  if (newData) {
    const [prodRes, ctgRes, accs] = await Promise.all([
      fetch("/getProduct?type=all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
      fetch("/getCategory?type=all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
      fetch("/getAccounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    ]);
    const [products, categories, foundAccs] = await Promise.all([
      prodRes.json(),
      ctgRes.json(),
      accs.json(),
    ]);

    window._INV_DATA.products = products;
    window._INV_DATA.categories = categories;
    accounts = foundAccs;
  }

  renderInventory();
}

function renderInventory() {
  const { products, categories } = window._INV_DATA;
  const inventoryCard = document.getElementById("inventory-card");
  const filterText = document
    .getElementById("inventory-search")
    .value.trim()
    .toLowerCase();
  const filterMode = document.getElementById("inventory-filter").value;

  // apply filters
  let filtered = products.filter((p) => {
    if (filterText && !p.name.toLowerCase().includes(filterText)) return false;
    if (filterMode === "low" && p.quantity >= p.min) return false;
    if (filterMode === "high" && p.quantity <= p.max) return false;
    return true;
  });

  // group by category
  const grouped = {};
  filtered.forEach((item) => {
    let ctg = categories.find((c) => c.category_id == item.category_id) || {
      name: "Unknown Category",
    };
    const ctgName = ctg.name.toUpperCase();
    if (!grouped[ctgName]) grouped[ctgName] = [];
    grouped[ctgName].push(item);
  });

  // render groups
  inventoryCard.innerHTML = "";
  Object.entries(grouped).forEach(([category, items]) => {
    if (!items.length) return;

    const row = document.createElement("div");
    row.className = "category-row";

    const heading = document.createElement("div");
    heading.className = "category-heading";
    heading.innerHTML = category;
    if (currentAdmin.userLevel >= 2) {
      heading.innerHTML += `
      <button class="action-button me-1 category-qr-gen-btn">
        <i class="bi bi-qr-code-scan"></i> Download QR
      </button>`;
    }

    const scroll = document.createElement("div");
    scroll.className = "scroll-container";
    scroll.addEventListener("wheel", (e) => {
      if (scroll.scrollWidth > scroll.clientWidth) {
        e.preventDefault();
        scroll.scrollLeft += e.deltaY;
      }
    });

    items.forEach((product) => {
      const iconStatus =
        product.min > product.quantity
          ? '<i class="bi bi-arrow-down"></i>'
          : product.max < product.quantity
          ? '<i class="bi bi-arrow-up"></i>'
          : "";
      const status =
        product.min > product.quantity
          ? '<i class="bi bi-exclamation-circle-fill" title="Low stocks" style="color:var(--red);"></i>'
          : product.max < product.quantity
          ? '<i class="bi bi-exclamation-circle-fill" title="High stocks" style="color:#00136f;"></i>'
          : '<i class="bi bi-check-circle-fill" title="Good" style="color:#007c02;"></i>';

      const card = document.createElement("div");
      card.className = "product-card";
      card.style.color =
        product.min > product.quantity
          ? "var(--red)"
          : product.max < product.quantity
          ? "#00136f"
          : "var(--black)";
      card.innerHTML = `
        <div>
          <h5>${iconStatus} ${product.name}</h5>
          <div class="divider"></div>
          <div>Qty: ${product.quantity} ${status}</div>
          <div>Min: <b>${product.min}</b> Max: <b>${product.max}</b></div>
        </div>
      `;
      card.addEventListener("click", () => showProductDetails(product, true));
      scroll.appendChild(card);
    });

    // QR button logic unchanged
    const originalCategory = categories.find(
      (ctg) => ctg.name.toUpperCase() === category
    );
    const qrBtn = heading.querySelector(".category-qr-gen-btn");
    qrBtn?.addEventListener("click", async () => {
      setLoading(qrBtn, true);
      if (!originalCategory) {
        notify("Unable to find the category ID for: " + category, {
          type: "error",
          duration: 5000,
        });
        setLoading(qrBtn, false);
        return;
      }
      notify("Generating QR file for " + originalCategory.name, {
        type: "success",
        duration: 10000,
      });
      const res = await fetch("/generateCategoryQr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: originalCategory.category_id }),
      });
      if (res.ok) {
        notify("Initiating Download", { type: "success", duration: 5000 });
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${originalCategory.name.replace(
          /\s+/g,
          "_"
        )}_qr_codes.docx`;
        link.click();
      } else {
        const error = await res.json();
        notify("QR Download Failed: " + (error.message || "unknown error"), {
          type: "error",
          duration: 5000,
        });
      }
      setLoading(qrBtn, false);
    });

    row.append(heading, scroll);
    inventoryCard.append(row, document.createElement("div") /* divider */);
  });
}
//
async function showProductDetails(product, intro) {
  if (currentAdmin.userLevel < 2) return;
  currentProduct = product;
  separator.style.display = "none";
  detailCard = document.querySelector(".product-details-card");
  detailCard.innerHTML = "";
  detailCard.style.display = "flex";

  const backBtn = document.createElement("button");
  backBtn.innerHTML = `<i class="bi bi-arrow-return-left"></i> Back to Inventory`;
  backBtn.className = "action-button back-button";
  backBtn.addEventListener("click", () => {
    detailCard.style.display = "none";
    separator.style.display = "";
    currentProduct = null;
  });
  detailCard.appendChild(backBtn);

  const detailWrapper = document.createElement("div");
  detailWrapper.className = "detail-wrapper";

  const status =
    product.quantity > product.max
      ? "overstock"
      : product.min > product.quantity
      ? "understock"
      : "";

  const colorIndicator =
    product.quantity > product.max
      ? `style="color: #00136f;"`
      : product.min > product.quantity
      ? `style="color: var(--red);"`
      : ``;

  const iconIndicator =
    product.quantity > product.max
      ? `<i class="bi bi-graph-up-arrow" ${colorIndicator} title=${status}></i>`
      : product.min > product.quantity
      ? `<i class="bi bi-graph-down-arrow" ${colorIndicator} title=${status}></i>`
      : `<i class="bi bi-check-circle"></i>`;

  const left = document.createElement("div");
  left.className = "detail-left";
  left.innerHTML = `
  <form id="editProductForm" class="product-form">
    <div class="form-group">
      <label for="product_name">Product Name</label>
      <input type="text" id="product_name" name="product_name" value="${
        product.name
      }" required />
    </div>

    <div class="form-group">
  <label for="product_qty" ${colorIndicator}>Quantity${
    status.length > 0 ? ` (${status})` : ""
  }</label>
  <div class="input-group">
    <span class="input-group-text" style="border: 1px solid black; background-color: transparent; border-right: none !important; border-radius: 8px 0 0 8px;" ${colorIndicator}>${iconIndicator}</span>
    <input
      type="text"
      class="form-control"
      id="product_qty"
      name="product_qty"
      value="${product.quantity}"
      style="border-left: none;"
      readonly
    />
  </div>
</div>

    <div class="form-group">
      <label for="product_min" ${
        status == "understock" ? colorIndicator : ""
      }>Required Min. Quantity</label>
      <input type="number" id="product_min" name="product_min" value="${
        product.min
      }" required />
    </div>

    <div class="form-group">
      <label for="product_max" ${
        status == "overstock" ? colorIndicator : ""
      }>Required Max. Quantity</label>
      <input type="number" id="product_max" name="product_max" value="${
        product.max
      }" required />
    </div>
    
    <div class="form-group">
      <label for="product_id">Product ID</label>
      <input type="text" id="product_id" name="product_id" value="${
        product.product_id
      }" readonly />
    </div>
    
    <div class="form-group">
          <label for="product_expiry">Product Expiry</label>
          <div style="display: flex; flex-direction: row">
            <input
              class="me-1"
              type="number"
              id="product_expiry"
              name="product_expiry"
              min="1"
              value="${product.expiry}"
              autocomplete="off"
              required
            />

            <select
              id="product_expiry_unit"
              name="product_expiry_unit"
              required
            >
              <option value="days" ${
                product.expiry_unit == "days" ? "selected" : ""
              }>Day(s)</option>
              <option value="months" ${
                product.expiry_unit == "months" ? "selected" : ""
              }>Month(s)</option>
              <option value="years" ${
                product.expiry_unit == "years" ? "selected" : ""
              }>Year(s)</option>
            </select>
          </div>
        </div>

    <div class="submit-container">
    ${
      currentAdmin.userLevel >= 3
        ? `<button class="action-button me-1 delete-product-btn"><i class="bi bi-trash3-fill" title="Delete Product"></i></button>`
        : ``
    }
    <button class="action-button me-1 qr-gen-btn"><i class="bi bi-qr-code-scan"></i> QR</button>
    <button type="submit" class="action-button" title="Save Changes"><i class="bi bi-floppy-fill"></i> Save</button>
      </div>
  </form>
  <div class="qr-container"></div>
  `;

  const right = document.createElement("div");
  right.className = "detail-right";

  const recordHolder = document.createElement("div");
  recordHolder.className = "record-holder";
  right.appendChild(recordHolder);

  const recordHolder2 = document.createElement("div");
  recordHolder2.className = "record-holder2";

  const inForm = document.createElement("form");
  inForm.className = "stockRecordForm";
  inForm.innerHTML = `
  
    <div class="form-group">
      <label for="in_amount">IN</label>
      <input type="number" id="in_amount" name="in_amount" placeholder="100" required />
    </div>
    <div class="submit-container">
      <button type="submit" class="action-button black-loading stock-record-btn"><i class="bi bi-box-arrow-in-down"></i> Save Record</button>
      </div>
  `;

  const outForm = document.createElement("form");
  outForm.className = "stockRecordForm";
  outForm.innerHTML = `
    <div class="form-group">
      <label for="out_amount">OUT</label>
      <div style="display: flex; gap: 3px;">
      <input type="number" id="out_amount" name="out_amount" placeholder="100" style="width: 45%;" required />
      <input type="text" id="remarks" name="remarks" style="width: 55%;" placeholder="Remarks (optional)" />
      </div>
    </div>
    <div class="submit-container">
      <button type="submit" class="action-button black-loading stock-record-btn"><i class="bi bi-box-arrow-up"></i> Save Record</button>
      </div>
  `;

  recordHolder2.append(inForm, outForm);
  right.appendChild(recordHolder2);
  detailWrapper.append(left, right);
  detailCard.appendChild(detailWrapper);
  separator.parentNode.appendChild(detailCard);

  inForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = +inForm.in_amount.value;
    if (!amount) return;
    const btn = e.submitter;
    setLoading(btn, true);
    const { success, error } = await fetch("/createStockRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id,
        type: "IN",
        amount: amount,
        author_id: currentAdmin.id,
      }),
    }).then((r) => r.json());
    if (success) {
      inForm.reset();
      setLoading(btn, false);
      notify("Added incoming record", { type: "success", duration: 5000 });
      await loadInventory(false, true);
    } else {
      setLoading(btn, false);
      notify(error || "Failed to add record", {
        type: "error",
        duration: 5000,
      });
    }
  });
  //
  outForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = +outForm.out_amount.value;
    if (!amount) return;
    const btn = e.submitter;
    setLoading(btn, true);
    const { success, error } = await fetch("/createStockRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id,
        type: "OUT",
        amount: amount,
        remarks: outForm.remarks.value,
        author_id: currentAdmin.id,
      }),
    }).then((r) => r.json());
    if (success) {
      outForm.reset();
      setLoading(btn, false);
      notify("Added outgoing record", { type: "success", duration: 5000 });
      await loadInventory(false, true);
    } else {
      setLoading(btn, false);
      notify(error || "Failed to add record", {
        type: "error",
        duration: 5000,
      });
    }
  });
  //
  const editForm = document.getElementById("editProductForm");
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    setLoading(btn, true);
    const product_id = editForm.product_id.value;
    const name = editForm.product_name.value.trim();
    const min = +editForm.product_min.value;
    const max = +editForm.product_max.value;
    const expiry = +editForm.product_expiry.value;
    const expiry_unit = editForm.product_expiry_unit.value;
    if (!name || min < 0 || max < 0 || expiry < 0 || !expiry_unit) {
      return alert("Please fill out all fields correctly.");
    }

    const res = await fetch("/editProduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id, name, min, max, expiry, expiry_unit }),
    });
    const { success, error } = await res.json();

    if (success) {
      notify("Product updated successfully", {
        type: "success",
        duration: 5000,
      });
      setLoading(btn, false);
      await loadInventory(false, true);
    } else {
      setLoading(btn, false);
      console.log(error);
      notify("Update failed: " + (error || "unknown error"), {
        type: "error",
        duration: 5000,
      });
    }
  });
  //
  const deleteBtn = editForm.querySelector(".delete-product-btn");
  deleteBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    const confirmed = confirm(
      "Are you sure you want to delete this product? All existing records associated to this product will be deleted!"
    );
    if (!confirmed) return;
    setLoading(deleteBtn, true);
    const res = await fetch("/deleteProduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.product_id }),
    });
    const { success, error } = await res.json();

    if (success) {
      await loadInventory(false, true);
      setLoading(deleteBtn, false);
      notify("Product deleted successfully", {
        type: "success",
        duration: 5000,
      });
      detailCard.style.display = "none";
      separator.style.display = "";
    } else {
      setLoading(deleteBtn, false);
      notify("Delete failed: " + (error || "unknown error"), {
        type: "error",
        duration: 5000,
      });
    }
  });

  const genQrButton = editForm.querySelector(".qr-gen-btn");
  genQrButton.addEventListener("click", async (e) => {
    e.preventDefault();
    setLoading(genQrButton, true);
    let res = await fetch("/generateQr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.product_id }),
    });
    if (res.ok) {
      res = await res.json();
      const qrLink = res.message;

      // 👇 Display the QR link in HTML
      const qrContainer = document.querySelector(".qr-container");
      qrContainer.innerHTML = `
    <img id="qrPreview" src="${qrLink}" class="qr-code" />
    <button id="downloadQrBtn" type="button" class="action-button" title="Open in New Tab" >Open in New Tab</button>
    `;

      document.getElementById("downloadQrBtn").addEventListener("click", () => {
        const qrImg = document.getElementById("qrPreview");
        window.open(qrImg.src, "_blank");
      });

      setLoading(genQrButton, false);
    } else {
      res = await res.json();
      notify("Generate failed: " + (res.error || "unknown error"), {
        type: "error",
        duration: 5000,
      });
      setLoading(genQrButton, false);
    }
  });

  await fetchAndRenderStockRecords(product.product_id, intro);
}
async function fetchAndRenderStockRecords(productId, intro) {
  const recordHolder = detailCard.querySelector(".record-holder");
  if (intro)
    recordHolder.innerHTML = `<div class="loading-holder m-3"><div class="loader3"></div><h4>Loading Records</h4></div>`;
  const res = await fetch("/getStockRecord?type=single", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: productId, days: 30 }),
  });
  const records = (await res.json()) || [];

  const inRecs = records.filter((r) => r.type === "IN");
  const outRecs = records.filter((r) => r.type === "OUT");

  const inCol = document.createElement("div");
  inCol.className = "in-records";
  inCol.innerHTML = buildRecordsColumn(
    "IN",
    inRecs,
    "IN",
    '<i class="bi bi-box-arrow-in-down"></i>'
  );

  const outCol = document.createElement("div");
  outCol.className = "out-records";
  outCol.innerHTML = buildRecordsColumn(
    "OUT",
    outRecs,
    "OUT",
    '<i class="bi bi-box-arrow-up"></i>'
  );

  recordHolder.innerHTML = ``;
  recordHolder.append(inCol, outCol);

  // wire up delete buttons for each record
  detailCard.querySelectorAll(".delete-record-btn")?.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const confirmed = confirm("Are you sure you want to delete this record?");
      if (!confirmed) return;
      setLoading(btn, true);
      const recItem = btn.closest(".record-item");
      if (!recItem) return;
      const recId = recItem.getAttribute("data-id");
      const { success, error } = await fetch("/deleteStockRecord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recId }),
      }).then((r) => r.json());

      if (success) {
        await fetchAndRenderStockRecords(productId);
        notify("Record deleted", { type: "success", duration: 5000 });
        setLoading(btn, false);
        await loadInventory(false, true);
      } else {
        await fetchAndRenderStockRecords(productId);
        setLoading(btn, false);
        console.log(error);
        notify(error || "Error deleting record", { type: "error", duration: 5000 });
      }
    });
  });
}
function buildRecordsColumn(title, records, type, icon) {
  const sign = type === "IN" ? "+" : "–";
  const cls = type === "IN" ? "in" : "out";

  if (!records.length) {
    return `<h3>${icon} ${title}</h3><p>No record yet.</p>`;
  }

  const usernameById = accounts.reduce((map, a) => {
    // if your account objects come back with `_id` instead of `id`, use a._id here
    map[a.id] = a.username;
    return map;
  }, {});

  const items = records
    .map((r) => {
      const username = usernameById[r.author_id] || "Unknown";
      return `
  <div class="record-item" data-id="${r._id}">
    <div class="record-content">
      <div class="record-main">
        <h4 class="qty ${cls}">${sign}${r.amount}</h4>
        <div class="date">
          ${r.formattedDateTime} • <b>${r.fromNow}</b>
        </div>
      </div>
      <div class="meta">By: <b>${username}</b></div>
      ${
        r.remarks
          ? `
        <div class="remarks">
          <i class="bi bi-info-circle"></i>
          <span style="font-size: 13px;">${r.remarks}</span>
        </div>
      `
          : ``
      }
    </div>
    ${
      currentAdmin.userLevel >= 3
        ? `
      <button type="button" class="action-button delete-record-btn black-loading" title="Delete record">
        <i class="bi bi-trash3-fill"></i>
      </button>
    `
        : ``
    }
  </div>
`;
    })
    .join("\n");

  return `<h3>${icon} ${title}</h3><div class="records-list">${items}</div>`;
}

//
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(inventoryStart);
});
