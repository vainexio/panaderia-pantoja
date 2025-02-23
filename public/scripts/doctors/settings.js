async function doctorSettings() {
  try {
      // Fetch the doctor's account using your currentAccount endpoint
      const accountResponse = await fetch('/currentAccount?type=doctor');
      if (!accountResponse.ok) {
        console.error("Failed to fetch account data");
        return;
      }
      const account = await accountResponse.json();

      // Populate the settings form fields
      document.getElementById('first_name').value = account.first_name || '';
      document.getElementById('last_name').value = account.last_name || '';
      // Since the doctor schema does not include account_type, we hardcode it.
      document.getElementById('account_type').value = 'Doctor';
      document.getElementById('contact_number').value = account.contact_number || '';
      document.getElementById('email').value = account.email || '';
      document.getElementById('password').value = account.password || '';

      // Now, fetch login sessions using the doctor's id
      const sessionResponse = await fetch('/getSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: account.doctor_id })
      });
      if (!sessionResponse.ok) {
        console.error("Failed to fetch login sessions");
        return;
      }
      const sessionData = await sessionResponse.json();
      const loginSessions = sessionData.loginSessions || [];

      // Build the HTML table for login sessions
      let tableHTML = `
        <table>
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Location</th>
              <th>Device ID</th>
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
