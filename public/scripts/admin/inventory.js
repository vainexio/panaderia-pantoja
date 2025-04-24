let separator, detailCard;
async function inventoryStart() {
  loadInventory(true)
}
async function loadInventory(intro) {
  separator = document.getElementById("stock-separator");
  let inventoryCard = document.getElementById("inventory-card");
  if (intro) inventoryCard.innerHTML = `<div class="loader2"></div><h4>Loading Inventory</h4>`;
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
    let category = categories.find(
      (ctg) => ctg.category_id == item.category_id
    );
    if (!category) category = { name: "Unknown Category" };
    const ctgName = category.name.toUpperCase();

    if (!grouped[ctgName]) grouped[ctgName] = [];
    grouped[ctgName].push(item);
  });

  Object.entries(grouped).forEach(([category, items]) => {
    const row = document.createElement("div");
    row.className = "category-row";

    const divider = document.createElement("div");
    //divider.className = "divider";

    const heading = document.createElement("div");
    heading.className = "category-heading";
    heading.textContent = category;

    const scroll = document.createElement("div");
    scroll.className = "scroll-container";

    scroll.addEventListener("wheel", function (e) {
      // Only scroll horizontally if it's overflowing
      if (scroll.scrollWidth > scroll.clientWidth) {
        e.preventDefault(); // prevent vertical scroll
        scroll.scrollLeft += e.deltaY;
      }
    });

    items.forEach((product) => {
      let status =
        product.min <= product.quantity
          ? `<i class="bi bi-check-circle-fill" title="Good" style="color:#007c02;"></i>`
          : `<i class="bi bi-exclamation-circle-fill" title="Low stocks" style="color:var(--red);"></i>`;
      const card = document.createElement("div");
      card.style.color =
        product.min > product.quantity ? "var(--red)" : "var(--black)";
      card.className = "product-card";
      card.innerHTML = `<div><h5>${product.name}</h5><div class="divider"></div><div>Qty: ${product.quantity} ${status}</div><div>Min: <b>${product.min}</b> Max: <b>${product.max}</b></div>`;

      card.addEventListener("click", () => showProductDetails(product));
      scroll.appendChild(card);
    });

    row.append(heading, scroll);
    inventoryCard.append(row, divider);
  });
}
//
async function showProductDetails(product) {
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
      <input ter" id="product_qty" name="product_qty" value="${product.quantity}" readonly />
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
    <button class="action-button me-1 delete-product-btn"><i class="bi bi-trash3-fill"></i> Delete Product</button>
    <button type="submit" class="action-button"><i class="bi bi-floppy-fill"></i> Save Changes</button>
      </div>
  </form>`;

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
      <input type="number" id="out_amount" name="out_amount" placeholder="100" required />
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
    setLoading(btn,true)
    const { success } = await fetch("/createStockRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id,
        type: "IN",
        amount,
      }),
    }).then((r) => r.json());
    if (success) {
      inForm.reset();
      await fetchAndRenderStockRecords(product.product_id);
      setLoading(btn,false);
      notify("Added incoming record", { type: "success", duration: 5000 });
      await loadInventory();
    } else {
      setLoading(btn,false);
      notify("Failed to add record", { type: "error", duration: 5000 });
    }
  });
  //
  outForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = +outForm.out_amount.value;
    if (!amount) return;
    const btn = e.submitter;
    setLoading(btn,true)
    const { success } = await fetch("/createStockRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.product_id,
        type: "OUT",
        amount,
      }),
    }).then((r) => r.json());
    if (success) {
      outForm.reset();
      await fetchAndRenderStockRecords(product.product_id);
      setLoading(btn,false);
      notify("Added outgoing record", { type: "success", duration: 5000 });
      await loadInventory();
    } else {
      setLoading(btn,false);
      notify("Failed to add record", { type: "error", duration: 5000 });
    }
  });
  //
  const editForm = document.getElementById("editProductForm");
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    setLoading(btn,true);
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
      body: JSON.stringify({ product_id, name, min, max }),
    });
    const { success, error } = await res.json();

    if (success) {
      notify("Product updated successfully", {
        type: "success",
        duration: 5000,
      });
      setLoading(btn,false);
      await loadInventory();
    } else {
      setLoading(btn,false);
      console.log(error);
      notify("Update failed: " + (error || "unknown error"), {
        type: "error",
        duration: 5000,
      });
    }
  });
  //
  const deleteBtn = editForm.querySelector(".delete-product-btn");
  deleteBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    
    const confirmed = confirm("Are you sure you want to delete this product? This will delete all existing records associated to this product");
    if (!confirmed) return;
    setLoading(deleteBtn,true);
    const res = await fetch("/deleteProduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.product_id }),
    });
    const { success, error } = await res.json();

    if (success) {
      await loadInventory();
      setLoading(deleteBtn,false);
      notify("Product deleted successfully", {
        type: "success",
        duration: 5000,
      });
      detailCard.style.display = "none";
      separator.style.display = "";
    } else {
      setLoading(deleteBtn,false);
      notify("Delete failed: " + (error || "unknown error"), {
        type: "error",
        duration: 5000,
      });
    }
  });

  await fetchAndRenderStockRecords(product.product_id, true);
}
async function fetchAndRenderStockRecords(productId, intro) {
  const recordHolder = detailCard.querySelector(".record-holder");
  if (intro)
    recordHolder.innerHTML = `<h3 class="m-3">Loading stock records…</h3>`;

  const res = await fetch("/getStockRecord?type=single", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: productId }),
  });
  const records = (await res.json()) || [];

  const inRecs = records.filter((r) => r.type === "IN");
  const outRecs = records.filter((r) => r.type === "OUT");
  recordHolder.innerHTML = ``;

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

  recordHolder.append(inCol, outCol);

  // wire up delete buttons for each record
  detailCard.querySelectorAll(".delete-record-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const confirmed = confirm("Are you sure you want to delete this record?");
      if (!confirmed) return;
      setLoading(btn,true);
      const recItem = btn.closest(".record-item");
      if (!recItem) return;
      const recId = recItem.getAttribute("data-id");
      const { success } = await fetch("/deleteStockRecord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recId }),
      }).then((r) => r.json());

      if (success) {
        await fetchAndRenderStockRecords(productId);
        notify("Record deleted", { type: "success", duration: 5000 });
        setLoading(btn,false);
        await loadInventory();
      } else {
        alert("Error deleting record");
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

  const items = records
    .map(
      (r) => `
    <div class="record-item" data-id="${r._id}">
      <div class="record-content">
        <h4 class="qty ${cls}">${sign}${r.amount}</h4>
        <div class="date">${r.formattedDateTime} • <b>${r.fromNow}</b></div>
      </div>
      <button type="button" class="action-button delete-record-btn black-loading" title="Delete record">
        <i class="bi bi-trash3-fill"></i>
      </button>
    </div>
  `
    )
    .join("\n");

  return `<h3>${icon} ${title}</h3><div class="records-list">${items}</div>`;
}

// kick things off when the DOM is ready
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(inventoryStart);
});
