async function adminSettings() {
  try {
    if (currentAdmin.userLevel < 3) {
      document.getElementById("admin_settings_username").readOnly = true;
      document.getElementById("toggle-password-btn").disabled = true;
      document.getElementById("saveChangesButton").disabled = true;
    }
    document.getElementById("admin_settings_username").value = currentAdmin.username;
    document.getElementById("admin_settings_id").value = "ACC-"+currentAdmin.id;
    document.getElementById("admin_settings_acc_level").value = currentAdmin.userLevel;

    const sessionResponse = await fetch("/getAllSessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: currentAdmin.id,
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
        <table class="table table-striped table-bordered">
          <thead class="thead-dark">
            <tr>
              <th scope="col">Session ID</th>
              <th scope="col">Location</th>
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
    <td>${session.session_id.slice(0, 10)}...${
        session.currentSession ? "<i> (you)</i>" : ""
      }</td>
    <td>${session.location}</td>
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
        setLoading(button, true);
        const current = this.getAttribute("current-session-id");
        if (current) {
          await removeSession(current, adminSettings);
          window.location = "/";
        } else {
          const sessionId = this.getAttribute("data-session-id");
          await removeSession(sessionId, adminSettings);
          notify("Device removed", { type: "success", duration: 5000 });
          setLoading(button, false);
        }
      });
    });

    document
      .getElementById("settingsForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();
        let btn = event.submitter;
        setLoading(btn,true)
        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );
        let accountData = await fetch("/currentAccount");
        if (accountData.ok) {
          accountData = await accountData.json();
          currentAdmin = accountData;
        } else return;

        const response = await fetch("/updateAccount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountData, formData }),
        });

        if (response.ok) {
          document.getElementById("admin_settings_old_password").value = ""
          document.getElementById("admin_settings_new_password").value = ""
          document.getElementById("admin_settings_confirm_password").value = ""
          notify("Account details updated", { type: "success", duration: 5000 });
        } else {
          const error = await response.json();
          notify(error.message || "Failed to update account details.", { type: "error", duration: 5000 });
        }
      setLoading(btn,false)
      });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(adminSettings);
});
