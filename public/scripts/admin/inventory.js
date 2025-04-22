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
  detailCard = document.createElement("div");
  detailCard.className = "inventory-card";

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
    <h2>${product.name}</h2>
    <p><strong>Product ID:</strong> ${product.product_id}</p>
    <p><strong>Quantity:</strong> ${product.quantity}</p>
    <p><strong>Min:</strong> ${product.min}</p>
    <p><strong>Max:</strong> ${product.max}</p>
    <p><strong>Expiry:</strong> ${product.expiry} ${product.expiry_unit}</p>
  `;

  // right: placeholder while fetching
  const right = document.createElement("div");
  right.className = "detail-right";
  right.innerHTML = `<h3>Loading stock records…</h3>`;

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
    return `<h3>${title}</h3><p>No ${title.toLowerCase()}.</p>`;
  }

  const items = records.map(r => `
    <div class="record-item" data-id="${r._id}">
      <div class="record-content">
        <h2 class="qty ${cls}">${sign}${r.amount}</h2>
        <div class="date">on ${r.date}</div>
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
inCol.innerHTML  = buildRecordsColumn("Incoming Stock", inRecs, "IN");

const outCol = document.createElement("div");
outCol.className = "out-records";
outCol.innerHTML = buildRecordsColumn("Outgoing Stock", outRecs, "OUT");

right.append(inCol, outCol);
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(loadInventory);
});
