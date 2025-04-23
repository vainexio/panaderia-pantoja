// inventory.js

let separator, detailCard;

// helper: fetch and render stock records for a given product ID
async function fetchAndRenderStockRecords(productId) {
  const res = await fetch("/getStockRecord?type=single", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: productId }),
  });
  const records = await res.json() || [];

  const inRecs  = records.filter(r => r.type === "IN");
  const outRecs = records.filter(r => r.type === "OUT");

  const recordHolder = detailCard.querySelector(".record-holder");
  recordHolder.innerHTML = ""; // clear previous

  const inCol = document.createElement("div");
  inCol.className = "in-records";
  inCol.innerHTML  = buildRecordsColumn("IN", inRecs, "IN", '<i class="bi bi-box-arrow-in-down"></i>');

  const outCol = document.createElement("div");
  outCol.className = "out-records";
  outCol.innerHTML = buildRecordsColumn("OUT", outRecs, "OUT", '<i class="bi bi-box-arrow-up"></i>');

  recordHolder.append(inCol, outCol);

  // wire up delete buttons for each record
  detailCard.querySelectorAll('.delete-record-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const recItem = btn.closest('.record-item');
      if (!recItem) return;
      const recId = recItem.getAttribute('data-id');
      const { success } = await fetch('/deleteStockRecord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recId }),
      }).then(r => r.json());

      if (success) {
        // re-fetch and re-render
        await fetchAndRenderStockRecords(productId);
      } else {
        alert('Error deleting record');
      }
    });
  });
}

// buildRecordsColumn unchanged from your original
function buildRecordsColumn(title, records, type, icon) {
  const sign = type === "IN" ? "+" : "–";
  const cls  = type === "IN" ? "in" : "out";

  if (!records.length) {
    return `<h3>${icon} ${title}</h3><p>No record yet.</p>`;
  }

  const items = records.map(r => `
    <div class="record-item" data-id="${r._id}">
      <div class="record-content">
        <h2 class="qty ${cls}">${sign}${r.amount}</h2>
        <div class="date">${r.fromNow}</div>
      </div>
      <button type="button"
              class="action-button delete-record-btn"
              title="Delete record">
        <i class="bi bi-trash3-fill"></i>
      </button>
    </div>
  `).join("\n");

  return `<h3>${icon} ${title}</h3><div class="records-list">${items}</div>`;
}

// initial inventory loader
async function loadInventory() {
  separator = document.getElementById("stock-separator");
  let inventoryCard = document.getElementById("inventory-card");
  let products = await fetch("/getProduct?type=all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
  });
  let categories = await fetch("/getCategory?type=all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
  });
  products = await products.json();
  categories = await categories.json();

  inventoryCard.innerHTML = "";
  const grouped = {};

  products.forEach((item) => {
    let category = categories.find(ctg => ctg.category_id == item.category_id);
    if (!category) category = { name: "Unknown Category" };
    const ctgName = category.name.toUpperCase();

    if (!grouped[ctgName]) grouped[ctgName] = [];
    grouped[ctgName].push(item);
  });

  Object.entries(grouped).forEach(([category, items]) => {
    const row = document.createElement("div");
    row.className = "category-row";

    const divider = document.createElement("div");
    divider.className = "divider";

    const heading = document.createElement("div");
    heading.className = "category-heading";
    heading.textContent = category;

    const scroll = document.createElement("div");
    scroll.className = "scroll-container";

    items.forEach((product) => {
      const card = document.createElement("div");
      card.className = "action-button product-card";
      card.innerHTML = `<div><strong>${product.name}</strong></div><div>Qty: ${product.quantity}</div>`;
      card.addEventListener("click", () => showProductDetails(product));
      scroll.appendChild(card);
    });

    row.append(heading, scroll);
    inventoryCard.append(row, divider);
  });
}

// show product details with editable form and stock records
async function showProductDetails(product) {
  separator.style.display = "none";
  detailCard = document.querySelector(".product-details-card");
  detailCard.innerHTML = "";
  detailCard.style.display = "flex";

  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back to Inventory";
  backBtn.className = "action-button back-button";
  backBtn.addEventListener("click", () => {
    detailCard.style.display = "none";
    separator.style.display = "";
  });
  detailCard.appendChild(backBtn);

  const detailWrapper = document.createElement("div");
  detailWrapper.className = "detail-wrapper";

  const left = document.createElement("div");
  left.className = "detail-left";
  left.innerHTML = `
  <form id="editProductForm" class="product-form">
    <div class="form-group">
      <label for="product_name">Product Name</label>
      <input type="text" id="product_name" name="product_name" value="${product.name}" required />
    </div>

    <div class="form-group">
      <label for="product_qty">Current Quantity</label>
      <input type="number" id="product_qty" name="product_qty" value="${product.quantity}" readonly />
    </div>

    <div class="form-group">
      <label for="product_min">Required Min. Quantity</label>
      <input type="number" id="product_min" name="product_min" value="${product.min}" required />
    </div>

    <div class="form-group">
      <label for="product_max">Required Max. Quantity</label>
      <input type="number" id="product_max" name="product_max" value="${product.max}" required />
    </div>
    
    <div class="form-group">
      <label for="product_id">Product ID</label>
      <input type="text" id="product_id" name="product_id" value="${product.product_id}" readonly />
    </div>
    
    <div class="form-group">
      <label for="product_expiry">Product Expiry</label>
      <input type="text" id="product_expiry" name="product_expiry" value="${product.expiry} ${product.expiry_unit}" readonly />
    </div>

    <div class="submit-container">
      <button type="submit" class="action-button edit-product-btn">Save Changes</button>
    </div>
    <div id="product_details_notif" class="notification" role="alert"></div>
  </form>;`

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
      <button type="submit" class="action-button black-loading stock-record-btn">Create Record</button>
    </div>
  `;

  const outForm = document.createElement("form");
  outForm.className = "stockRecordForm";
  outForm.innerHTML = `
    <div class="form-group">
      <label for="out_amount">OUT</label>
      <input type="number" id="out_amount" name="out_amount" placeholder="100" required />
    </div>
    <div class="submit-container">
      <button type="submit" class="action-button black-loading stock-record-btn">Create Record</button>
    </div>
  `;

  recordHolder2.append(inForm, outForm);
  right.appendChild(recordHolder2);

  detailWrapper.append(left, right);
  detailCard.appendChild(detailWrapper);
  separator.parentNode.appendChild(detailCard);

  // initial render of records
  await fetchAndRenderStockRecords(product.product_id);

  // wire up record forms to refresh only the record-holder
  inForm.addEventListener("submit", async e => {
    e.preventDefault();
    const amount = +inForm.in_amount.value;
    if (!amount) return;
    const { success } = await fetch("/createStockRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.product_id, type: "IN", amount }),
    }).then(r => r.json());
    if (success) {
      inForm.reset();
      await fetchAndRenderStockRecords(product.product_id);
      await loadInventory()
    } else {
      alert("Error creating IN record");
    }
  });

  outForm.addEventListener("submit", async e => {
    e.preventDefault();
    const amount = +outForm.out_amount.value;
    if (!amount) return;
    const { success } = await fetch("/createStockRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.product_id, type: "OUT", amount }),
    }).then(r => r.json());
    if (success) {
      outForm.reset();
      await fetchAndRenderStockRecords(product.product_id);
      await loadInventory();
    } else {
      alert("Error creating OUT record");
    }
  });
  
  const editForm = document.getElementById("editProductForm");
editForm.addEventListener("submit", async e => {
  e.preventDefault();

  const product_id = editForm.product_id.value;
  const name = editForm.product_name.value.trim();
  const min = +editForm.product_min.value;
  const max = +editForm.product_max.value;

  if (!name || min < 0 || max < 0) {
    return alert("Please fill out all fields correctly.");
  }

  const res = await fetch("/editProduct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id, name, min, max })
  });
  const { success, error } = await res.json();
  const notification = document.getElementById("regis_notif");
  
  if (success) {
    notification.textContent = "Product registered successfully!";
    notification.className = "alert alert-success mt-3 rounded-3";
    await loadInventory();
  } else {
    const error = await success.json();
    notification.textContent =
      error.message || "Failed to register product.";
          notification.className = "alert alert-danger mt-3 rounded-3";
    alert("Update failed: " + (error || "unknown error"));
  }
});
}

// kick things off when the DOM is ready
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(loadInventory);
});
