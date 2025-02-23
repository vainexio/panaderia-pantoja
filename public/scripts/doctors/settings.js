async function doctorSettings() {
  try {
      // Populate the doctor's settings form fields
      document.getElementById('doc_settings_first_name').value = currentDoctor.first_name  || '';
      document.getElementById('doc_settings_last_name').value = currentDoctor.last_name || '';
      document.getElementById('doc_settings_account_type').value = 'Doctor';
      document.getElementById('doc_settings_contact_number').value = currentDoctor.contact_number || '';
      document.getElementById('doc_settings_email').value = currentDoctor.email || '';
      document.getElementById('doc_settings_password').value = currentDoctor.password || '';

      // Now, fetch login sessions using the doctor's id
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

      // Build the HTML table for login sessions using Bootstrap classes
      let tableHTML = `
        <div class="table-responsive">
          <table class="table table-striped table-bordered">
            <thead class="thead-dark">
              <tr>
                <th scope="col">IP Address</th>
                <th scope="col">Location</th>
                <th scope="col">Device ID</th>
              </tr>
            </thead>
            <tbody>
      `;
      loginSessions.forEach(session => {
        tableHTML += `
              <tr>
                <td>${session.ip_address}</td>
                <td>${session.location}</td>
                <td>${session.device_id}</td>
              </tr>
        `;
      });
      tableHTML += `
            </tbody>
          </table>
        </div>
      `;
      // Update the login sessions container in your HTML
      document.querySelector('.login-sessions-card').innerHTML = tableHTML;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
}

document.addEventListener("DOMContentLoaded", async function () {
  // Wait for content load
  waitUntilReady(doctorSettings);
});
