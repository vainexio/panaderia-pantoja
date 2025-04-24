async function dashboard() {
  const { products, stockRecords } = await fetch('/api/raw-inventory').then(r=>r.json());
  const prodMap = Object.fromEntries(products.map(p=>[p.product_id,p]));
  const today = new Date(), days=7;
  // prepare date buckets
  const dates = Array.from({length:days})
    .map((_,i)=>{ const d=new Date(); d.setDate(today.getDate()-(days-1-i)); return d.toISOString().slice(0,10); });

  // separate IN/OUT
  const ins  = stockRecords.filter(r=>r.type==='IN');
  const outs = stockRecords.filter(r=>r.type==='OUT');

  // helper: group by product, sum amount
  function sumBy(records){
    return records.reduce((acc,r)=>{
      acc[r.product_id] = (acc[r.product_id]||0) + r.amount;
      return acc;
    }, {});
  }
  const totalOuts = sumBy(outs);
  const totalIns  = sumBy(ins);

  // 1) 7-day OUTs per product (bar)
  new Chart(c1,{type:'bar',
    data:{
      labels: Object.keys(totalOuts).map(id=>prodMap[id].name),
      datasets:[{ label:'OUT', data:Object.values(totalOuts) }]
    }
  });

  // 2) Top-out product (doughnut)
  const topId = Object.entries(totalOuts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  new Chart(c2,{type:'doughnut',
    data:{
      labels: ['Others', prodMap[topId].name],
      datasets:[{ data:[
        Object.values(totalOuts).reduce((s,v)=>s+v,0) - totalOuts[topId],
        totalOuts[topId]
      ]}]
    }
  });

  // 3) Low-stock by category (doughnut)
  const low = products.filter(p=>p.quantity < p.min);
  const byCat = low.reduce((acc,p)=>{
    acc[p.category_id] = (acc[p.category_id]||0)+1; return acc;
  }, {});
  new Chart(c3,{type:'doughnut',
    data:{
      labels: Object.keys(byCat).map(cid=>products.find(p=>p.category_id===cid).category_id),
      datasets:[{ data:Object.values(byCat) }]
    }
  });

  // 4) IN vs OUT volume (pie)
  new Chart(c4,{type:'pie',
    data:{
      labels:['IN','OUT'],
      datasets:[{ data:[
        ins.reduce((s,r)=>s+r.amount,0),
        outs.reduce((s,r)=>s+r.amount,0)
      ] }]
    }
  });

  // 5) Daily OUT trend (line)
  const dailyOut = dates.map(d=>{
    return outs.filter(r=>r.date.slice(0,10)===d).reduce((s,r)=>s+r.amount,0);
  });
  new Chart(c5,{type:'line',
    data:{ labels:dates, datasets:[{ label:'Daily OUT', data:dailyOut }] }
  });

  // 6) Stock turnover rate per product (turnover = OUT/avgStock)
  const avgStock = prod=> (prod.min + prod.max)/2;
  new Chart(c6,{type:'bar',
    data:{
      labels: Object.keys(totalOuts).map(id=>prodMap[id].name),
      datasets:[{
        label:'Turnover Rate',
        data: Object.entries(totalOuts).map(([id,val])=> val / avgStock(prodMap[id]) )
      }]
    },
    options:{ scales:{ y:{ ticks:{ callback:v=>v.toFixed(2) } } } }
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(dashboard);
});