async function loadMetrics() {
  try {
    const resp = await fetch('/api/storage/usage');
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    const container = document.getElementById('metrics-container');
    container.innerHTML = ''; // clear old cards

    // helper to build a card
    function makeCard(title, value, extra = '') {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${title}</h3>
        <div class="value">${value}</div>
        ${extra}
      `;
      return card;
    }

    // 1) Used / Limit card with progress bar
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
    container.appendChild(usedCard);

    // 2) Bytes, KB, GB cards
    container.appendChild(makeCard('Bytes',     used.bytes.toLocaleString()));
    container.appendChild(makeCard('Kilobytes', used.kilobytes + ' KB'));
    container.appendChild(makeCard('Gigabytes', used.gigabytes + ' GB'));

    // 3) Details card
    const detailsCard = document.createElement('div');
    detailsCard.className = 'card';
    detailsCard.innerHTML = `<h3>Details</h3>`;
    const ul = document.createElement('ul');
    ul.className = 'details-list';
    for (const [key, val] of Object.entries(data.details)) {
      let display;
      if (typeof val === 'object') {
        if (val.megabytes !== undefined) display = `${val.megabytes} MB`;
        else if (val.kilobytes !== undefined) display = `${val.kilobytes} KB`;
        else display = `${val.bytes} B`;
      } else {
        display = val;
      }
      const li = document.createElement('li');
      li.innerHTML = `<span>${key}</span><span>${display}</span>`;
      ul.appendChild(li);
    }
    detailsCard.appendChild(ul);
    container.appendChild(detailsCard);

  } catch (err) {
    console.error('Could not load metrics:', err);
  }
}

// on DOM ready, fetch & then refresh every 30s
document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(loadMetrics);
});