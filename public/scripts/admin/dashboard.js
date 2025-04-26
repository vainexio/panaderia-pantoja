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
  // STATS SUMMARY
;(function(){
  const statGrid = document.querySelector('.stat-grid');

  function makeStatCard(title, content){
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `<h4>${title}</h4><div class="stat-content">${content}</div>`;
    statGrid.appendChild(card);
  }

  const totalProducts = products.length;
  const totalInStock = stockRecords.reduce((sum, r)=>r.type==='IN'?sum+r.amount:sum, 0) -
                       stockRecords.reduce((sum, r)=>r.type==='OUT'?sum+r.amount:sum, 0);

  const lowThreshold = 10;
  const highThreshold = 50;

  const lowStockProducts = products.filter(p=>p.quantity<=lowThreshold);
  const highStockProducts = products.filter(p=>p.quantity>=highThreshold);

  makeStatCard('Total Products', totalProducts);
  makeStatCard('Total Stock', totalInStock);

  makeStatCard('Low-stock Products', 
    lowStockProducts.length 
      ? `<ul>${lowStockProducts.map(p=>`<li>${p.name} (${p.quantity})</li>`).join('')}</ul>` 
      : `<p>None</p>`
  );

  makeStatCard('High-stock Products', 
    highStockProducts.length 
      ? `<ul>${highStockProducts.map(p=>`<li>${p.name} (${p.quantity})</li>`).join('')}</ul>` 
      : `<p>None</p>`
  );
})();

  // PUT CHARTS HERE
  ;(function(){
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not found – include via <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>');
    return;
  }

  const chartGrid     = document.querySelector('.chart-grid');
  const catFilterElem = document.getElementById('chartCategoryFilter');

  // --- helper to create a card + canvas and return its 2D context ---
  function makeChartCard(title, id){
    const card = document.createElement('div');
    card.className = 'chart-card';
    card.innerHTML = `<h5>${title}</h5><canvas id="${id}"></canvas>`;
    chartGrid.appendChild(card);
    return document.getElementById(id).getContext('2d');
  }

  // populate category dropdown
  catFilterElem.innerHTML = `<option value="all">ALL CATEGORIES</option>` +
    categories.map(c=>`<option value="${c.category_id}">${c.name.toUpperCase()}</option>`).join('');

  // build 7-day labels
  const labels7 = [];
  for(let d=new Date(sevenAgo); d<=now; d.setDate(d.getDate()+1)){
    labels7.push(d.toISOString().slice(0,10));
  }
  const recent = stockRecords.filter(r=>{
    const d=new Date(r.date);
    return d>=sevenAgo && d<=now;
  });

  function clearProductCharts(){
    document.querySelectorAll('[id^="chart-inout-"]').forEach(c=>c.closest('.chart-card').remove());
  }

  function renderProductCharts(catId){
    clearProductCharts();
    products
      .filter(p=>catId==='all'||p.category_id===catId)
      .forEach(p=>{
        const pid = p.product_id;
        const ctx = makeChartCard(`${p.name} (7-Day IN vs OUT)`, `chart-inout-${pid}`);
        const ins={}, outs={};
        labels7.forEach(d=>{ins[d]=0;outs[d]=0;});
        recent.forEach(r=>{
          if(r.product_id!==pid) return;
          const day=new Date(r.date).toISOString().slice(0,10);
          (r.type==='IN'?ins:outs)[day]+=r.amount;
        });
        new Chart(ctx,{
          type:'line',
          data:{ labels:labels7, datasets:[
            {label:'IN',  data:labels7.map(d=>ins[d]),  fill:false},
            {label:'OUT', data:labels7.map(d=>outs[d]), fill:false}
          ]},
          options:{responsive:true}
        });
      });
  }

  // initial draw & on-change
  renderProductCharts(catFilterElem.value);
  catFilterElem.addEventListener('change',()=>renderProductCharts(catFilterElem.value));
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
