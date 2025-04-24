async function dashboard() {
  const { products, stockRecords } = await fetch("/api/raw-inventory").then(
    (r) => r.json()
  );
  const prodMap = Object.fromEntries(products.map((p) => [p.product_id, p]));
  const sevenAgo = new Date();
  sevenAgo.setDate(sevenAgo.getDate() - 7);

  const ins = stockRecords.filter((r) => r.type === "IN");
  const outs = stockRecords.filter((r) => r.type === "OUT");

  // 1) 7-Day IN vs OUT per product
  const outs7 = outs.filter((r) => new Date(r.date) >= sevenAgo);
  const ins7 = ins.filter((r) => new Date(r.date) >= sevenAgo);
  const sumByProduct = (arr) =>
    arr.reduce((acc, r) => {
      acc[r.product_id] = (acc[r.product_id] || 0) + r.amount;
      return acc;
    }, {});
  const out7Sum = sumByProduct(outs7),
    in7Sum = sumByProduct(ins7);
  const allIds7 = Array.from(
    new Set([...Object.keys(out7Sum), ...Object.keys(in7Sum)])
  );
  const labels7 = allIds7.map((id) => prodMap[id]?.name || id);
  const dataOut7 = allIds7.map((id) => out7Sum[id] || 0);
  const dataIn7 = allIds7.map((id) => in7Sum[id] || 0);
  new Chart(document.getElementById("c1"), {
    type: "bar",
    data: {
      labels: labels7,
      datasets: [
        { label: "IN", data: dataIn7 },
        { label: "OUT", data: dataOut7 },
      ],
    },
    options: {
      responsive: true,
      scales: { x: { stacked: false }, y: { beginAtZero: true } },
    },
  });

  // 2) Top outgoing products (7-day)
  const sortedOut7 = Object.entries(out7Sum)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  new Chart(document.getElementById("c2"), {
    type: "bar",
    data: {
      labels: sortedOut7.map((e) => prodMap[e[0]].name),
      datasets: [{ label: "OUT", data: sortedOut7.map((e) => e[1]) }],
    },
    options: { responsive: true },
  });

  // 4) IN vs OUT Volume overall
  new Chart(document.getElementById("c4"), {
    type: "pie",
    data: {
      labels: ["IN", "OUT"],
      datasets: [
        {
          data: [
            ins.reduce((s, r) => s + r.amount, 0),
            outs.reduce((s, r) => s + r.amount, 0),
          ],
        },
      ],
    },
    options: { responsive: true },
  });

  // 5) Daily OUT Trend
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d.toISOString().slice(0, 10);
  });
  const outsByDay = days.map((d) =>
    outs
      .filter((r) => r.date.slice(0, 10) === d)
      .reduce((s, r) => s + r.amount, 0)
  );
  new Chart(document.getElementById("c5"), {
    type: "line",
    data: { labels: days, datasets: [{ label: "Daily OUT", data: outsByDay }] },
    options: { responsive: true },
  });

  // 6) Stock Turnover Rate
  const avgStock = (p) => (p.min + p.max) / 2;
  const turnoverIds = Object.keys(out7Sum);
  new Chart(document.getElementById("c6"), {
    type: "bar",
    data: {
      labels: turnoverIds.map((id) => prodMap[id].name),
      datasets: [
        {
          label: "Turnover",
          data: turnoverIds.map((id) => out7Sum[id] / avgStock(prodMap[id])),
        },
      ],
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });
}

document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(dashboard);
});
