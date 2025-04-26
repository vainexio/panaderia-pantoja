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

  function makeStatCard(title, contentHTML, isTransparent=false, isBigWhite=false) {
    const card = document.createElement('div');
    card.className = 'stat-card' + (isTransparent ? ' transparent-card' : '');
    // build inner HTML
    let titleStyle   = isBigWhite ? 'color:white; font-weight:normal;' : '';
    let contentStyle = isBigWhite ? 'color:white;' : '';
    card.innerHTML = `
      <h4 style="${titleStyle}">${title}</h4>
      <div class="stat-content" style="${contentStyle}">
        ${contentHTML}
      </div>`;
    statGrid.appendChild(card);
  }

  const totalProducts = products.length;
  const totalIn  = stockRecords.filter(r=>r.type==='IN').reduce((s,r)=>s+r.amount,0);
  const totalOut = stockRecords.filter(r=>r.type==='OUT').reduce((s,r)=>s+r.amount,0);
  const totalStock = totalIn - totalOut;

  // render Total Products & Total Stock as transparent, big white numbers
  makeStatCard(
    'Total Products',
    `<p style="font-size:3rem; font-weight:bold; color:white; margin:0;">${totalProducts}</p>`,
    /*isTransparent=*/true,
    /*isBigWhite=*/true
  );
  makeStatCard(
    'Total Stock',
    `<p style="font-size:3rem; font-weight:bold; color:white; margin:0;">${totalStock}</p>`,
    /*isTransparent=*/true,
    /*isBigWhite=*/true
  );

  // now the low/high stock (unchanged styling)
  const lowThreshold  = 10;
  const highThreshold = 50;
  const lowStockProducts  = products.filter(p=>p.quantity<=lowThreshold);
  const highStockProducts = products.filter(p=>p.quantity>=highThreshold);

  makeStatCard(
    'Low-stock Products',
    lowStockProducts.length
      ? `<ul>${lowStockProducts.map(p=>`<li>${p.name} (${p.quantity})</li>`).join('')}</ul>`
      : `<p>None</p>`
  );
  makeStatCard(
    'High-stock Products',
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
        const ctx = makeChartCard(`${p.name}`, `chart-inout-${pid}`);
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
