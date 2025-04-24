async function dashboard() {
      // fetch raw data and categories concurrently
      const [raw, categories] = await Promise.all([
        fetch('/api/raw-inventory').then(r=>r.json()),
        fetch('/getCategories').then(r=>r.json())
      ]);
      const { products, stockRecords } = raw;

      // map category_id to name
      const catMap = Object.fromEntries(categories.map(c=>[c.category_id, c.name]));
      const prodMap = Object.fromEntries(products.map(p=>[p.product_id,p]));
      const now = new Date(), sevenAgo = new Date(now); sevenAgo.setDate(now.getDate()-7);

      // SUMMARY: total products per category
      const totalByCat = products.reduce((acc,p)=>{ acc[p.category_id] = (acc[p.category_id]||0)+1; return acc; },{});
      const totalList = document.getElementById('totalByCat');
      Object.entries(totalByCat).forEach(([cid,count])=>{
        const li = document.createElement('li');
        li.textContent = `${catMap[cid].toUpperCase()||cid.toUpperCase()}: ${count}`;
        totalList.appendChild(li);
      });

      // SUMMARY: low-stock count
      const lowProducts = products.filter(p=>p.quantity < p.min);
      document.getElementById('lowCount').textContent = lowProducts.length;

      // SUMMARY: expiring soon
      const ins = stockRecords.filter(r=>r.type==='IN');
      const outs = stockRecords.filter(r=>r.type==='OUT');
      const sumBy = arr=>arr.reduce((a,r)=>{ a[r.product_id]=(a[r.product_id]||0)+r.amount; return a; },{});
      const inSum = sumBy(ins), outSum = sumBy(outs);
      const currentStock = Object.fromEntries(Object.keys(inSum).map(id=>[id, inSum[id] - (outSum[id]||0)]));
      const soonThresh = new Date(now); soonThresh.setDate(now.getDate()+7);
      const expSet = new Set();
      ins.forEach(r=>{
        const p=prodMap[r.product_id]; if(!p) return;
        const dt=new Date(r.date); dt.setDate(dt.getDate()+p.expiry);
        if(dt>now && dt<=soonThresh && currentStock[r.product_id]>0) expSet.add(r.product_id);
      });
      const expList=document.getElementById('expiringList');
      expSet.forEach(id=>{ const li=document.createElement('li'); li.textContent=prodMap[id].name; expList.appendChild(li); });

      // CHART 1: 7-Day Outs per Product
      const outs7 = outs.filter(r=>new Date(r.date)>=sevenAgo);
      const out7Sum = sumBy(outs7);
      new Chart(document.getElementById('c1'), { type:'bar', data:{ labels:Object.keys(out7Sum).map(id=>prodMap[id].name), datasets:[{ label:'OUT', data:Object.values(out7Sum) }] }, options:{responsive:true} });

      // CHART 2: Top-Out Product
      const top=Object.entries(out7Sum).sort((a,b)=>b[1]-a[1])[0];
      new Chart(document.getElementById('c2'),{ type:'doughnut', data:{ labels: top?[prodMap[top[0]].name] : ['None'], datasets:[{ data: top?[top[1]]:[0] }] }, options:{responsive:true} });

      // CHART 3: IN vs OUT Volume
      const totalIn = Object.values(inSum).reduce((s,v)=>s+v,0);
      const totalOut = Object.values(outSum).reduce((s,v)=>s+v,0);
      new Chart(document.getElementById('c4'),{ type+ v, 0);
  const totalOut = Object.values(outSum).reduce((s, v) => s + v, 0);
  new Chart(document.getElementById("c4"), {
    type: "pie",
    data: { labels: ["IN", "OUT"], datasets: [{ data: [totalIn, totalOut] }] },
    options: { responsive: true },
  });

  // CHART 4: Daily IN/OUT Trend
      const days=Array.from({length:7}).map((_,i)=>{ const d=new Date(now); d.setDate(now.getDate()-6+i); return d.toISOString().slice(0,10); });
      const inByDay=days.map(d=>ins.filter(r=>r.date.slice(0,10)===d).reduce((s,r)=>s+r.amount,0));
      const outByDay=days.map(d=>outs.filter(r=>r.date.slice(0,10)===d).reduce((s,r)=>s+r.amount,0));
      new Chart(document.getElementById('c5'),{ type:'line', data:{ labels:days, datasets:[{ label:'IN', data:inByDay },{ label:'OUT', data:outByDay }] }, options:{responsive:true, scales:{y:{beginAtZero:true}}} });

      // CHART 5: Stock Turnover Rate
      const avgStock=p=>(p.min+p.max)/2;
      const turnover=Object.entries(out7Sum).map(([id,val])=>val/avgStock(prodMap[id]));
      new Chart(document.getElementById('c6'),{ type:'bar', data:{ labels:Object.keys(out7Sum).map(id=>prodMap[id].name), datasets:[{ label:'Turnover', data:turnover }] }, options:{responsive:true, scales:{y:{beginAtZero:true}}} });
  const refresh = document.getElementById("refreshBtn");
  refresh.addEventListener("click", () => {
    setLoading(refresh,true)
    await dashboard();
    setLoading(refresh,false)
  });
}

document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(dashboard);
});
