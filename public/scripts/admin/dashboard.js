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
  ;(function(){
    // ensure Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not found – be sure to include it via <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>"');
      return;
    }

    const chartGrid = document.querySelector('.chart-grid');

    // helper to create a card+canvas
    function makeChartCard(title, id) {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.innerHTML = `<h3>${title}</h3><canvas id="${id}"></canvas>`;
      chartGrid.appendChild(card);
      return document.getElementById(id).getContext('2d');
    }

    // prepare 7-day labels
    const labels7 = [];
    for (let d = new Date(sevenAgo); d <= now; d.setDate(d.getDate()+1)) {
      labels7.push(d.toISOString().slice(0,10));
    }

    // filter last 7d records
    const recent = stockRecords.filter(r => {
      const d = new Date(r.date);
      return d >= sevenAgo && d <= now;
    });

    // 1) 7-Day Incoming vs Outgoing per Product (one chart per product)
    products.forEach(p => {
      const pid = p.product_id;
      const ctx = makeChartCard(
        `7-Day IN vs OUT — ${p.name}`,
        `chart-inout-${pid}`
      );
      // initialize daily buckets
      const ins = {}, outs = {};
      labels7.forEach(d => { ins[d] = 0; outs[d] = 0; });
      // sum only this product’s records
      recent.forEach(r => {
        if (r.product_id !== pid) return;
        const day = new Date(r.date).toISOString().slice(0,10);
        if (r.type === 'IN')  ins[day] += r.amount;
        else                  outs[day] += r.amount;
      });
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels7,
          datasets: [
            { label: 'IN',  data: labels7.map(d => ins[d]),  fill: false },
            { label: 'OUT', data: labels7.map(d => outs[d]), fill: false }
          ]
        },
        options: { responsive: true }
      });
    });

    // aggregate per product over 7d
    const sumByProd = (type)=>{
      return recent
        .filter(r=>r.type===type)
        .reduce((acc,r)=>{
          acc[r.product_id]=(acc[r.product_id]||0)+r.amount;
          return acc;
        }, {});
    };
    const in7 = sumByProd('IN'), out7 = sumByProd('OUT');

    // 2) Top 10 outgoing products
    {
      const sorted = Object.entries(out7)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10);
      const labels = sorted.map(([id])=>prodMap[id]?.name||id);
      const data   = sorted.map(([,v])=>v);
      const ctx = makeChartCard('7-Day Top 10 OUT', 'chart-top-out');
      new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label:'OUT', data }] }, options:{ indexAxis:'y', responsive:true } });
    }

    // 3) Top 10 incoming products
    {
      const sorted = Object.entries(in7)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10);
      const labels = sorted.map(([id])=>prodMap[id]?.name||id);
      const data   = sorted.map(([,v])=>v);
      const ctx = makeChartCard('7-Day Top 10 IN', 'chart-top-in');
      new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label:'IN', data }] }, options:{ indexAxis:'y', responsive:true } });
    }

    // 4) Total Products per Category
    {
      const labels = Object.keys(totalByCat).map(cid=>catMap[cid].toUpperCase());
      const data   = Object.values(totalByCat);
      const ctx = makeChartCard('Total Products per Category', 'chart-total-cat');
      new Chart(ctx, { type:'pie', data:{ labels, datasets:[{ data }] }, options:{ responsive:true } });
    }

    // 5) Low-stock vs High-stock count
    {
      const lowCount  = products.filter(p=>p.quantity < p.min).length;
      const highCount = products.filter(p=>p.quantity > p.max).length;
      const ctx = makeChartCard('Low vs High Stock', 'chart-low-high');
      new Chart(ctx,{
        type:'bar',
        data:{
          labels:['Low stock','High stock'],
          datasets:[{ label:'Products', data:[lowCount,highCount] }]
        },
        options:{ responsive:true }
      });
    }
  })();

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
