async function loadAccounts() {
  const res = await fetch('/accounts');
  const accounts = await res.json();
  const tbody = document.querySelector('#accountsTable tbody');
  tbody.innerHTML = '';

  accounts.forEach(acc => {
    const isProtected = acc.id === 1 || acc.id === 2;
    const actionCell = isProtected
      ? '<td class="align-middle text-center"><i>Default Account</i></td>'
      : `<td class="align-middle text-center">
          <button class="btn btn-sm btn-success save-btn mr-1" data-id="${acc.id}">Save</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${acc.id}">Delete</button>
        </td>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="align-middle">ACC-${acc.id}</td>
      <td class="align-middle">
        <input type="text" class="form-control username-input" data-id="${acc.id}" value="${acc.username}" ${isProtected? 'disabled': ''} />
      </td>
      <td class="align-middle text-center">
        <input type="password" class="form-control password-input" data-id="${acc.id}" placeholder="New password" ${isProtected? 'disabled': ''} />
      </td>
      <td class="align-middle text-center">
        <select class="form-control level-select" data-id="${acc.id}" ${isProtected? 'disabled': ''}>
          <option value="3" ${acc.userLevel==3?'selected':''}>Level 3</option>
          <option value="2" ${acc.userLevel==2?'selected':''}>Level 2</option>
          <option value="1" ${acc.userLevel==1?'selected':''}>Level 1</option>
        </select>
      </td>
      ${actionCell}
    `;
    tbody.appendChild(tr);
  });

  // attach delete events
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!confirm('Delete ACC-' + id + '?')) return;
      setLoading(btn, true);
      try {
        const res = await fetch(`/accounts/${id}`, { method: 'DELETE' });
        if (res.ok) {
          notify(`ACC-${id} deleted`, { type: 'success', duration: 5000 });
          loadAccounts();
        } else {
          const err = await res.json();
          notify(err.message || 'Delete failed', { type: 'error', duration: 5000 });
        }
      } catch (e) {
        notify('Error deleting account', { type: 'error', duration: 5000 });
      }
      setLoading(btn, false);
    });
  });

  // attach save events
  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const select = document.querySelector(`.level-select[data-id='${id}']`);
      const level = select.value;
      const usernameInput = document.querySelector(`.username-input[data-id='${id}']`);
      const newUsername = usernameInput.value.trim();
      const passwordInput = document.querySelector(`.password-input[data-id='${id}']`);
      const newPassword = passwordInput.value;

      const payload = { userLevel: Number(level), username: newUsername };
      if (newPassword) payload.password = newPassword;

      setLoading(btn, true);
      try {
        const res = await fetch(`/accounts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          notify(`Successfully Updated ACC-${id}`, { type: 'success', duration: 5000 });
          loadAccounts();
        } else {
          const err = await res.json();
          notify(err.message || 'Update failed', { type: 'error', duration: 5000 });
        }
      } catch (e) {
        notify('Error updating account', { type: 'error', duration: 5000 });
      }
      setLoading(btn, false);
    });
  });
}

async function accountManagement() {
  document
    .getElementById('accountCreationForm')
    .addEventListener('submit', async function (event) {
      event.preventDefault();
      let btn = event.submitter;
      setLoading(btn, true);
      const formData = Object.fromEntries(new FormData(event.target).entries());

      const response = await fetch('/createAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        notify('Account created', { type: 'success', duration: 5000 });
        document.getElementById('accountCreationForm').reset();
        loadAccounts();
      } else {
        const error = await response.json();
        notify(error.message || 'Failed to create account', { type: 'error', duration: 5000 });
      }
      setLoading(btn, false);
    });

  // initial load
  loadAccounts();
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(accountManagement);
});