async function doctorSettings() {
  try {
    // Populate doctor's settings form fields using the currentDoctor object.
    document.getElementById('doc_settings_first_name').value = currentDoctor.first_name  || '';
    document.getElementById('doc_settings_last_name').value = currentDoctor.last_name || '';
    document.getElementById('doc_settings_account_type').value = 'Doctor';
    document.getElementById('doc_settings_contact_number').value = currentDoctor.contact_number || '';
    document.getElementById('doc_settings_email').value = currentDoctor.email || '';
    document.getElementById('doc_settings_password').value = currentDoctor.password || '';

    // Fetch login sessions for the current doctor.
    const sessionResponse = await fetch('/getSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: currentDoctor.doctor_id })
    });
    if (!sessionResponse.ok) {
      console.error("Failed to fetch login sessions");
      return;
    }
    const sessionData = await sessionResponse.json();
    const loginSessions = sessionData.loginSessions || [];

    // Build the HTML table using Bootstrap classes.
    let tableHTML = `
      <div class="table-responsive">
        <button id="remove-all-sessions" class="btn btn-danger mb-3">Remove All Sessions</button>
        <table class="table table-striped table-bordered">
          <thead class="thead-dark">
            <tr>
              <th scope="col">IP Address</th>
              <th scope="col">Location</th>
              <th scope="col">Device ID</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;
    // Note: Although we don't display session_id, we include it as a data attribute for deletion.
    loginSessions.forEach(session => {
      tableHTML += `
            <tr data-session-id="${session.session_id}">
              <td>${session.ip_address}</td>
              <td>${session.location}</td>
              <td>${session.device_id}</td>
              <td>
                <button class="btn btn-sm btn-danger remove-session-btn" data-session-id="${session.session_id}">
                  Remove
                </button>
              </td>
            </tr>
      `;
    });
    tableHTML += `
          </tbody>
        </table>
      </div>
    `;
    // Update the login sessions container.
    document.querySelector('.login-sessions-card').innerHTML = tableHTML;

    // Attach event listeners for each remove button.
    document.querySelectorAll('.remove-session-btn').forEach(button => {
      button.addEventListener('click', async function () {
        const sessionId = this.getAttribute('data-session-id');
        await removeSession(sessionId);
      });
    });
    
    // Attach event listener for the "Remove All Sessions" button.
    const removeAllBtn = document.getElementById('remove-all-sessions');
    if (removeAllBtn) {
      removeAllBtn.addEventListener('click', async function () {
        await removeAllSessions(currentDoctor.doctor_id,'doctor');
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function removeSession(sessionId) {
  try {
    const response = await fetch('/removeSession', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    if (response.ok) {
      console.log("Session removed successfully");
      // Refresh the sessions table.
      doctorSettings();
    } else {
      console.error("Failed to remove session");
    }
  } catch (error) {
    console.error("Error removing session:", error);
  }
}

async function removeAllSessions(accountId,type) {
  try {
    const response = await fetch('/removeAllSessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId,type })
    });
    if (response.ok) {
      console.log("All sessions removed successfully");
      doctorSettings();
    } else {
      console.error("Failed to remove all sessions");
    }
  } catch (error) {
    console.error("Error removing all sessions:", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(doctorSettings);
});
