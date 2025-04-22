async function loadInventory() {
  const res = await fetch("/getProducts");
  const data = await res.json();

  const inventory = document.getElementById("inventory-card");
  const grouped = {};

  data.forEach((item) => {
    let category = item.category.toUpperCase()
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(item);
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
      card.className = "product-card";
      card.innerHTML = `<div><strong>${product.name}</strong></div><div>Qty: ${product.quantity}</div>`;
      scroll.appendChild(card);
    });

    row.appendChild(heading);
    row.appendChild(scroll);
    inventory.appendChild(row);
    inventory.appendChild(divider);
  });
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(loadInventory);
});
