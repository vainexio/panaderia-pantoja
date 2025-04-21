async function productRegistration() {
  if (!window.productRegistrationFormAttached) {
    window.productRegistrationFormAttached = true;

    document
      .getElementById("productForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );
        const notification = document.getElementById("regis_notif");

        const response = await fetch("/registerProduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          notification.textContent = "Product registered successfully!";
          notification.className = "alert alert-success mt-3 rounded-3";
        } else {
          const error = await response.json();
          notification.textContent =
            error.message || "Failed to register product.";
          notification.className = "alert alert-danger mt-3 rounded-3";
        }
        document.getElementById("productForm").reset();

        setTimeout(function () {
          if (notification.textContent.length > 0) {
            notification.textContent = "";
            notification.className = "";
          }
        }, 2000);
      });
    
    
    ///
    const container = document.querySelector('.products-card');

  // Build table skeleton
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Category</th>
        <th>Min</th>
        <th>Max</th>
        <th>Expiry</th>
        <th>Expiry Unit</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  container.appendChild(table);
  const tbody = table.querySelector('tbody');

  // Fetch and render products
  fetch('/getProducts')
    .then(res => res.json())
    .then(products => {
      products.forEach(p => {
        const row = document.createElement('tr');

        // For each field, wrap in .form-group > input
        ['name','category','min','max','expiry','expiry_unit'].forEach(field => {
          const td = document.createElement('td');
          td.innerHTML = `
            <div class="form-group">
              <input type="text"
                     id="${field}_${p._id}"
                     name="${field}"
                     required
                     value="${p[field] ?? ''}"/>
            </div>
          `;
          row.appendChild(td);
        });

        // Actions column
        const actionTd = document.createElement('td');
        actionTd.innerHTML = `
          <button data-action="save"   data-id="${p._id}">Save</button>
          <button data-action="delete" data-id="${p._id}">Delete</button>
        `;
        row.appendChild(actionTd);

        tbody.appendChild(row);
      });
    })
    .catch(console.error);

  // Delegate clicks for Save / Delete
  container.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'save') {
      const payload = { id };
      document.querySelectorAll(`input[id$="_${id}"]`)
        .forEach(input => payload[input.name] = input.value);

      fetch('/updateProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(() => alert('Product saved'))
      .catch(console.error);

    } else if (btn.dataset.action === 'delete') {
      fetch(`/deleteProduct/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(resp => {
          if (resp.success) {
            btn.closest('tr').remove();
          }
        })
        .catch(console.error);
    }
  });
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(productRegistration);
});
