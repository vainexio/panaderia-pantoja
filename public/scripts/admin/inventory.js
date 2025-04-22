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
  right.innerHTML = `<p>Loading stock records…</p>`;

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

  const inRecs  = records.filter(r => r.type === "IN");
  const outRecs = records.filter(r => r.type === "OUT");

  right.innerHTML = ""; // clear “Loading…”

  const inCol = document.createElement("div");
  inCol.className = "in-records";
  inCol.innerHTML = `<h3>Incoming Stock</h3>` +
    (inRecs.length
      ? `<ul>${inRecs.map(r => `<li>${r.amount} on ${r.date}</li>`).join("")}</ul>`
      : `<p>No incoming records.</p>`);

  const outCol = document.createElement("div");
  outCol.className = "out-records";
  outCol.innerHTML = `<h3>Outgoing Stock</h3>` +
    (outRecs.length
      ? `<ul>${outRecs.map(r => `<li>${r.amount} on ${r.date}</li>`).join("")}</ul>`
      : `<p>No outgoing records.</p>`);

  right.append(inCol, outCol);
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(loadInventory);
});
