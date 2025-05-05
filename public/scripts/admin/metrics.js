async function loadMetrics() {
  try {
    const resp = await fetch('/api/storage/usage');
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    const c = document.getElementById('metrics');
    c.innerHTML = ''; // clear old

    // Helper to create a card
    function makeCard(title, value, extraHTML = '') {
      const d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = `
        <h3>${title}</h3>
        <div class="value">${value}</div>
        ${extraHTML}
      `;
      return d;
    }

    // 1. Storage Used card (with progress bar)
    const used = data.storageUsed;
    const pct  = data.percentUsed;
    const usedCard = makeCard(
      'Used / Limit',
      `${used.megabytes} MB / ${data.maxLimit.megabytes} MB`,
      `<div class="progress-bar-wrapper">
         <div class="progress-bar" style="width: ${pct};"></div>
       </div>
       <div class="value">${pct}</div>`
    );
    c.appendChild(usedCard);

    // 2. Bytes, KB, GB cards
    c.appendChild(makeCard('Bytes',    used.bytes.toLocaleString()));
    c.appendChild(makeCard('Kilobytes', used.kilobytes + ' KB'));
    c.appendChild(makeCard('Gigabytes', used.gigabytes + ' GB'));

    // 3. Details list
    const detailsCard = document.createElement('div');
    detailsCard.className = 'card';
    detailsCard.innerHTML = `<h3>Details</h3>`;
    const ul = document.createElement('ul');
    ul.className = 'details-list';
    for (const [key, val] of Object.entries(data.details)) {
      let disp;
      if (typeof val === 'object') {
        disp = `${val.megabytes || val.kilobytes || val.bytes} ${val.megabytes? 'MB': val.kilobytes? 'KB': 'B'}`;
      } else {
        disp = val;
      }
      const li = document.createElement('li');
      li.innerHTML = `<span>${key}</span><span>${disp}</span>`;
      ul.appendChild(li);
    }
    detailsCard.appendChild(ul);
    c.appendChild(detailsCard);

  } catch (err) {
    console.error('Could not load metrics:', err);
  }
}

// initial + auto‑refresh every 30s
document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(loadMetrics);
});