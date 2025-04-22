let inventoryCard, detailCard;

async function loadInventory() {
  inventoryCard = document.getElementById("inventory-card");
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
  
  const inventory = document.getElementById("inventory-card");
  inventory.innerHTML = ""
  const grouped = {};
  
  products.forEach((item) => {
    let category = categories.find(ctg => ctg.category_id == item.category_id)
    if (!category) category = { name: "Unknown Category" }
    let ctgName = category.name.toUpperCase()
    
    if (!grouped[ctgName]) grouped[ctgName] = [];
    grouped[ctgName].push(item);
  });

  Object.entries(grouped).forEach(([category, items]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    
    const divider = document.createElement("div");
    row.className = "divider";
    
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
    
    row.appendChild(heading);
    row.appendChild(scroll);
    inventory.appendChild(row);
    inventory.appendChild(divider);
  });
}
async function showProductDetails(product) {
  // 1. Hide the existing inventory list
  inventoryCard.style.display = "none";

  // 2. Create a new wrapper for details
  detailCard = document.querySelector(".product-details-card");
  console.log(detailCard)
  if (!detailCard) {
    detailCard = document.createElement("div");
    detailCard.className = "product-details-card";
  }

  // 3. Back button (just removes the details view + shows inventory again)
  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back to Inventory";
  backBtn.className = "action-button back-button";
  backBtn.addEventListener("click", () => {
    detailCard.remove();
    inventoryCard.style.display = "";
  });
  detailCard.appendChild(backBtn);

  // 4. Two‑column wrapper
  const detailWrapper = document.createElement("div");
  detailWrapper.className = "detail-wrapper";

  // left: product info
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
      <input type="number" id="product_qty" name="product_qty" value="${product.quantity}" />
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
  </form>
`;

  // right: placeholder while fetching
  const right = document.createElement("div");
  right.className = "detail-right";
  
  const recordHolder = document.createElement("div");
  recordHolder.className = "record-holder";
  
  right.innerHTML = `<h3 class="m-3">Loading stock records…</h3>`;

  detailWrapper.append(left, right);
  detailCard.appendChild(detailWrapper);

  // 5. Attach to the same parent as inventoryCard
  inventoryCard.parentNode.appendChild(detailCard);

  // 6. Fetch & render stock records
  const res = await fetch("/getStockRecord?type=single", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: product.product_id }),
  });
  const records = await res.json();
  if (!records) return right.innerHTML = `<h3>❌ No record yet</h3>`;
  
  const inRecs  = records.filter(r => r.type === "IN");
  const outRecs = records.filter(r => r.type === "OUT");

  right.innerHTML = ""; // clear “Loading…”

  function buildRecordsColumn(title, records, type) {
  const sign = type === "IN" ? "+" : "–";
  const cls  = type === "IN" ? "in" : "out";

  if (!records.length) {
    return `<h3>${title}</h3><p>No record yet.</p>`;
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
  `).join("");

  return `<h3>${title}</h3><div class="records-list">${items}</div>`;
}

// … later in your code:
const inCol = document.createElement("div");
inCol.className = "in-records";
inCol.innerHTML  = buildRecordsColumn("📥 IN", inRecs, "IN");

const outCol = document.createElement("div");
outCol.className = "out-records";
outCol.innerHTML = buildRecordsColumn("📤 OUT", outRecs, "OUT");
  recordHolder.append(inCol, outCol);
  right.appendChild(recordHolder);
  
  const recordHolder2 = document.createElement("div");
  recordHolder2.className = "record-holder2";
  
  const inForm = document.createElement("div");
  inForm.className = "stockRecordForm"
  inForm.innerHTML = `<form id="categoryForm" class="product-form">
      <div class="form-group">
        <label for="in_amount">IN</label>
        <input type="text" id="in_amount" name="in_amount" placeholder="100" required />
      </div>
      <div class="submit-container">
        <button type="submit" class="action-button stock-record-btn">Create Record</button>
      </div>
    </form>`
  const outForm = document.createElement("div");
  outForm.className = "stockRecordForm"
  outForm.innerHTML = `<form id="categoryForm" class="product-form">
      <div class="form-group">
        <label for="out_amount">OUT</label>
        <input type="text" id="out_amount" name="out_amount" placeholder="100" required />
      </div>
      <div class="submit-container">
        <button type="submit" class="action-button stock-record-btn">Create Record</button>
      </div>
    </form>`
  
  recordHolder2.appendChild(inForm)
  recordHolder2.appendChild(outForm)
  right.appendChild(recordHolder2)
  
  // Event listeners to handle form submissions
inForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("in_amount").value;
  
  if (amount) {
    const res = await fetch("/createStockRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id,
        type: "IN",
        amount: parseInt(amount),
      }),
    });
    const result = await res.json();
    if (result.success) {
      alert("IN record created successfully!");
      showProductDetails(product); // Reload inventory to update the records
    } else {
      alert("Error creating IN record");
    }
  }
});

outForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("out_amount").value;

  if (amount) {
    const res = await fetch("/createStockRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id,
        type: "OUT",
        amount: parseInt(amount),
      }),
    });
    const result = await res.json();
    if (result.success) {
      alert("OUT record created successfully!");
      showProductDetails(product); // Reload inventory to update the records
    } else {
      alert("Error creating OUT record");
    }
  }
});
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(loadInventory);
});
