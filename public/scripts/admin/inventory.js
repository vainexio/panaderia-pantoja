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
  detailCard.className = "product-details-card";

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
  left.innerHTML = `...`;  // keep your existing form structure

  // right: placeholder while fetching
  const right = document.createElement("div");
  right.className = "detail-right";
  
  // Fetch & render stock records
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

  // Build the stock records section dynamically
  const recordHolder = document.createElement("div");
  recordHolder.className = "record-holder";
  
  const stockForms = await renderStockRecordsForm(product.product_id);  // Dynamically generate forms
  recordHolder.appendChild(stockForms);

  // Add the record columns (IN/OUT)
  const inCol = document.createElement("div");
  inCol.className = "in-records";
  inCol.innerHTML = buildRecordsColumn("📥 IN", inRecs, "IN");

  const outCol = document.createElement("div");
  outCol.className = "out-records";
  outCol.innerHTML = buildRecordsColumn("📤 OUT", outRecs, "OUT");

  recordHolder.append(inCol, outCol);
  right.appendChild(recordHolder);

  detailWrapper.append(left, right);
  detailCard.appendChild(detailWrapper);

  // 5. Attach to the same parent as inventoryCard
  inventoryCard.parentNode.appendChild(detailCard);
}
// Refactor to create records with less redundancy
async function createStockRecordForm(productId, type) {
  const form = document.createElement('form');
  form.className = 'stockRecordForm';
  form.dataset.type = type;

  const input = document.createElement('input');
  input.type = 'number';
  input.id = `${type}_amount`;
  input.placeholder = `Enter ${type === 'IN' ? 'received' : 'sold'} quantity`;
  input.required = true;

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'action-button stock-record-btn';
  submitBtn.textContent = `Create ${type} Record`;

  form.appendChild(input);
  form.appendChild(submitBtn);

  // Add event listener to the form
  form.addEventListener("submit", (e) => handleStockRecordSubmit(e, productId, type));

  return form;
}

// Generic submit handler for both "IN" and "OUT" types
async function handleStockRecordSubmit(e, productId, type) {
  e.preventDefault();
  
  const amount = e.target.querySelector(`#${type}_amount`).value;

  if (!amount || amount <= 0) return alert("Please enter a valid amount.");

  // Submit the stock record
  const res = await fetch("/createStockRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      type,
      amount: parseInt(amount),
    }),
  });

  const result = await res.json();
  if (result.success) {
    alert(`${type} record created successfully!`);
    loadInventory();  // Reload inventory to update the records
  } else {
    alert(`Error creating ${type} record.`);
  }
}

// To create both "IN" and "OUT" forms dynamically
async function renderStockRecordsForm(productId) {
  const stockFormsContainer = document.createElement('div');
  
  const inForm = await createStockRecordForm(productId, "IN");
  const outForm = await createStockRecordForm(productId, "OUT");

  stockFormsContainer.append(inForm, outForm);
  
  return stockFormsContainer;
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(loadInventory);
});
