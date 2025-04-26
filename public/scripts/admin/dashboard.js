let innerHTML = null;
async function dashboard() {
  let dashboardElement = document.getElementById("dashboard");
  if (!innerHTML) innerHTML = dashboardElement.innerHTML;
  dashboardElement.innerHTML = `<div class="loading-holder m-3"><div class="loader2 inverted"></div><h4 style="color:white;">Loading Dashboard</h4></div>`;
  
  const [raw, categories] = await Promise.all([
    fetch("/api/raw-inventory").then((r) => r.json()),
    fetch("/getCategories").then((r) => r.json()),
  ]);
  const { products, stockRecords } = raw;
  // map category_id to name
  const catMap = Object.fromEntries(
    categories.map((c) => [c.category_id, c.name])
  );
  const prodMap = Object.fromEntries(products.map((p) => [p.product_id, p]));
  const now = new Date(),
    sevenAgo = new Date(now);
  sevenAgo.setDate(now.getDate() - 7);
  //
  dashboardElement.innerHTML = innerHTML;
  //
  const refresh = document.getElementById("refreshBtn");
  // SUMMARY: total products per category
  const totalByCat = products.reduce((acc, p) => {
    acc[p.category_id] = (acc[p.category_id] || 0) + 1;
    return acc;
  }, {});
  const totalList = document.getElementById("totalByCat");
  Object.entries(totalByCat).forEach(([cid, count]) => {
    const li = document.createElement("li");
    li.textContent = `${
      catMap[cid].toUpperCase() || cid.toUpperCase()
    }: ${count}`;
    totalList.appendChild(li);
  });

  // SUMMARY: low-stock count
  const lowProducts = products.filter((p) => p.quantity < p.min);
  document.getElementById("lowCount").textContent = lowProducts.length;

  // SUMMARY: expiring soon
  const ins = stockRecords.filter((r) => r.type === "IN");
  const outs = stockRecords.filter((r) => r.type === "OUT");
  const sumBy = (arr) =>
    arr.reduce((a, r) => {
      a[r.product_id] = (a[r.product_id] || 0) + r.amount;
      return a;
    }, {});
  const inSum = sumBy(ins),
    outSum = sumBy(outs);
  const currentStock = Object.fromEntries(
    Object.keys(inSum).map((id) => [id, inSum[id] - (outSum[id] || 0)])
  );
  const soonThresh = new Date(now);
  soonThresh.setDate(now.getDate() + 7);
  const expSet = new Set();
  ins.forEach((r) => {
    const p = prodMap[r.product_id];
    if (!p || !p.expiry || !p.expiry_unit) return;

    const dt = new Date(r.date);
    switch (p.expiry_unit.toLowerCase()) {
      case "days":
        dt.setDate(dt.getDate() + p.expiry);
        break;
      case "months":
        dt.setMonth(dt.getMonth() + p.expiry);
        break;
      case "years":
        dt.setFullYear(dt.getFullYear() + p.expiry);
        break;
      default:
        dt.setDate(dt.getDate() + p.expiry); // fallback to days
    }

    if (dt > now && dt <= soonThresh && currentStock[r.product_id] > 0) {
      expSet.add(r.product_id);
    }
  });
  const expList = document.getElementById("expiringList");
  expSet.forEach((id) => {
    const li = document.createElement("li");
    li.textContent = prodMap[id].name;
    expList.appendChild(li);
  });

  // PUT CHARTS HERE
  
  //
  refresh.addEventListener("click", async () => {
    await dashboard();
  });

  const downloadForm = document.getElementById("downloadDataForm");
  let isCooldown = false;

  downloadForm.addEventListener("submit", (e) => {
    e.preventDefault(); // prevent default form submission
    let btn = e.submitter;
    if (isCooldown) {
      notify("Please wait 30 seconds before downloading again.", {
        type: "warn",
        duration: 5000,
      });
      return;
    }
    setLoading(btn,true)

    const filter = document.getElementById("filter_download").value;
    if (!filter) return;

    window.location = `/download-inventory?filter=${encodeURIComponent(
      filter
    )}`;
    setLoading(btn, false);
    isCooldown = true;

    setTimeout(() => {
      isCooldown = false;
    }, 30000); // 30 seconds
  });
}

document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(dashboard);
});
