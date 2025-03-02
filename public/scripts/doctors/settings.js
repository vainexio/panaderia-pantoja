async function doctorSettings() {
  try {
    document.getElementById("doc_settings_first_name").value =
      currentDoctor.first_name;
    document.getElementById("doc_settings_last_name").value =
      currentDoctor.last_name;
    document.getElementById("doc_settings_account_type").value = "Doctor";
    document.getElementById("doc_settings_contact_number").value =
      currentDoctor.contact_number;
    document.getElementById("doc_settings_email").value = currentDoctor.email;

    const sessionResponse = await fetch("/getAllSessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: currentDoctor.doctor_id,
        type: "doctor",
      }),
    });
    if (!sessionResponse.ok) {
      console.error("Failed to fetch login sessions");
      return;
    }
    const sessionData = await sessionResponse.json();
    const loginSessions = sessionData.loginSessions || [];

    let tableHTML = `
      <div class="table-responsive">
        <button id="remove-other-sessions" class="btn btn-danger mb-3">Logout Other Sessions</button>
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
    loginSessions.forEach((session) => {
      const rowClass = session.currentSession ? "table-primary" : "";
      const button = !session.currentSession
        ? `<button class="btn btn-sm btn-danger remove-session-btn" data-session-id="${session.session_id}">Remove Device</button>`
        : `<button class="action-button remove-session-btn" current-session-id="${session.session_id}">Logout</button>`;

      tableHTML += `
            <tr data-session-id="${session.session_id}" class="${rowClass}">
              <td>${session.ip_address}</td>
              <td>${session.location}</td>
              <td>${session.device_id}</td>
              <td>
                ${button}
              </td>
            </tr>
      `;
    });
    tableHTML += `
          </tbody>
        </table>
      </div>
    `;
    document.querySelector(".login-sessions-card").innerHTML = tableHTML;

    document.querySelectorAll(".remove-session-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const current = this.getAttribute("current-session-id");
        if (current) {
          await removeSession(current, doctorSettings);
          window.location = "/";
        } else {
          const sessionId = this.getAttribute("data-session-id");
          await removeSession(sessionId, doctorSettings);
        }
      });
    });

    const removeAllBtn = document.getElementById("remove-other-sessions");
    if (removeAllBtn) {
      removeAllBtn.addEventListener("click", async function () {
        await removeOtherSessions(
          currentDoctor.doctor_id,
          "doctor",
          doctorSettings
        );
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(doctorSettings);
});
