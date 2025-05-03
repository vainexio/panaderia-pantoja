let innerHTML = null;
async function dashboard() {
  let dashboardElement = document.getElementById("dashboard");
  if (!innerHTML) innerHTML = dashboardElement.innerHTML;
  dashboardElement.innerHTML = `<div class="loading-holder m-3"><div class="loader2 inverted"></div><h4 style="color:white;">Loading Dashboard</h4></div>`;

  const [raw, categories] = await Promise.all([
    fetch("/rawInventory").then((r) => r.json()),
    fetch("/getCategories").then((r) => r.json()),
  ]);
  const { products, stockRecords } = raw;

  const catMap = Object.fromEntries(
    categories.map((c) => [c.category_id, c.name])
  );
  const prodMap = Object.fromEntries(products.map((p) => [p.product_id, p]));

  dashboardElement.innerHTML = innerHTML;

  const refresh = document.getElementById("refreshBtn");

  // STAT SUMMARY
  (function () {
    const statGrid = document.querySelector(".stat-grid");

    function makeStatCard(
      title,
      contentHTML,
      isTransparent = false,
      isBigWhite = false
    ) {
      const card = document.createElement("div");
      card.className = "stat-card" + (isTransparent ? " transparent-card" : "");
      let titleStyle = isBigWhite ? "color:white; font-weight:normal;" : "";
      let contentStyle = isBigWhite ? "color:white;" : "";
      card.innerHTML = `
        <h4 style="${titleStyle}">${title}</h4>
        <div class="stat-content" style="${contentStyle}">
          ${contentHTML}
        </div>`;
      statGrid.appendChild(card);
    }

    const totalProducts = products.length;

    // Option A: Use actual product quantities instead of calculating from IN/OUT
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    // Render cards
    makeStatCard(
      "Total Products",
      `<p style="font-size:3rem; font-weight:bold; color:white; margin:0;">${totalProducts}</p>`,
      true,
      true
    );
    makeStatCard(
      "Total Stock",
      `<p style="font-size:3rem; font-weight:bold; color:white; margin:0;">${totalStock}</p>`,
      true,
      true
    );

    const lowStockProducts = products
      .filter((p) => p.min !== undefined && p.quantity <= p.min)
      .sort((a, b) => a.quantity - b.quantity); // lowest to highest

    const highStockProducts = products
      .filter((p) => p.max !== undefined && p.quantity >= p.max)
      .sort((a, b) => a.quantity - b.quantity); // lowest to highest

    makeStatCard(
      "Understock Products",
      lowStockProducts.length
        ? `<ul>${lowStockProducts
            .map((p) => `<li>${p.name} (${p.quantity})</li>`)
            .join("")}</ul>`
        : `<p>None</p>`
    );

    makeStatCard(
      "Overstock Products",
      highStockProducts.length
        ? `<ul>${highStockProducts
            .map((p) => `<li>${p.name} (${p.quantity})</li>`)
            .join("")}</ul>`
        : `<p>None</p>`
    );
  })();

  // CHARTS SECTION
  (function () {
    if (typeof Chart === "undefined") {
      console.error("Chart.js not found");
      return;
    }

    const chartGrid = document.querySelector(".chart-grid");
    const catFilterElem = document.getElementById("chartCategoryFilter");
    const dateFilterElem = document.getElementById("chartDateRangeFilter");

    function makeChartCard(title, id) {
      const card = document.createElement("div");
      card.className = "chart-card";
      card.innerHTML = `<h5>${title}</h5><canvas id="${id}"></canvas>`;
      chartGrid.appendChild(card);
      return document.getElementById(id).getContext("2d");
    }

    catFilterElem.innerHTML =
      `<option value="all">ALL CATEGORIES</option>` +
      categories
        .map(
          (c) =>
            `<option value="${c.category_id}">${c.name.toUpperCase()}</option>`
        )
        .join("");

    function getDateRangeLabels(range) {
      const now = new Date();
      const start = new Date();
      if (range === "7") start.setDate(now.getDate() - 6);
      else if (range === "14") start.setDate(now.getDate() - 13);
      else if (range === "30") start.setDate(now.getDate() - 29);
      const labels = [];
      for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
        labels.push(d.toISOString().slice(0, 10));
      }
      return labels;
    }

    function getRecentStockRecords(range) {
      const now = new Date();
      const start = new Date();
      if (range === "7") start.setDate(now.getDate() - 6);
      else if (range === "14") start.setDate(now.getDate() - 13);
      else if (range === "30") start.setDate(now.getDate() - 29);
      return stockRecords.filter((r) => {
        const d = new Date(r.date);
        return d >= start && d <= now;
      });
    }

    function clearProductCharts() {
      document
        .querySelectorAll('[id^="chart-inout-"]')
        .forEach((c) => c.closest(".chart-card").remove());
    }

    function renderProductCharts(catId, dateRange) {
      clearProductCharts();
      const labels = getDateRangeLabels(dateRange);
      const recent = getRecentStockRecords(dateRange);

      products
        .filter((p) => catId === "all" || p.category_id === catId)
        .forEach((p) => {
          const pid = p.product_id;
          const ctx = makeChartCard(`${p.name}`, `chart-inout-${pid}`);
          const ins = {},
            outs = {};
          labels.forEach((d) => {
            ins[d] = 0;
            outs[d] = 0;
          });
          recent.forEach((r) => {
            if (r.product_id !== pid) return;
            const day = new Date(r.date).toISOString().slice(0, 10);
            (r.type === "IN" ? ins : outs)[day] += r.amount;
          });
          new Chart(ctx, {
            type: "line",
            data: {
              labels: labels,
              datasets: [
                {
                  label: "IN",
                  data: labels.map((d) => ins[d]),
                  fill: false,
                  borderColor: "green",
                },
                {
                  label: "OUT",
                  data: labels.map((d) => outs[d]),
                  fill: false,
                  borderColor: "red",
                },
              ],
            },
            options: { responsive: true },
          });
        });
    }

    function updateCharts() {
      renderProductCharts(catFilterElem.value, dateFilterElem.value);
    }

    catFilterElem.addEventListener("change", updateCharts);
    dateFilterElem.addEventListener("change", updateCharts);

    updateCharts(); // initial render
  })();

  refresh.addEventListener("click", async () => {
    await dashboard();
  });

  const downloadForm = document.getElementById("downloadDataForm");
  let isCooldown = false;

  downloadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let btn = e.submitter;
    if (isCooldown) {
      notify("Please wait 30 seconds before downloading again.", {
        type: "warn",
        duration: 5000,
      });
      return;
    }
    setLoading(btn, true);
    const filter = document.getElementById("filter_download").value;
    if (!filter) return;
    window.location = `/downloadInventory?filter=${encodeURIComponent(
      filter
    )}`;
    setLoading(btn, false);
    isCooldown = true;
    setTimeout(() => {
      isCooldown = false;
    }, 30000);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(dashboard);
});
