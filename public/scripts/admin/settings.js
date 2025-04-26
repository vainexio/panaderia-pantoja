async function adminSettings() {
  try {
    accountCreation();
    document.getElementById("admin_settings_first_name").value = currentAdmin.username;
    document.getElementById("admin_settings_id").value = currentAdmin.id;
    document.getElementById("admin_settings_acc_level").value = "Level "+currentAdmin.userLevel;
    
    
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
        <button id="remove-other-sessions" class="btn btn-danger mb-3">Logout Other Devices</button>
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

    const removeAllBtn = document.getElementById("remove-other-sessions");
    if (removeAllBtn) {
      removeAllBtn.addEventListener("click", async function () {
        setLoading(removeAllBtn, true);
        await removeOtherSessions(currentAdmin.id, adminSettings);
        notify("Other devices were removed", {
          type: "success",
          duration: 5000,
        });
        setLoading(removeAllBtn, false);
      });
    }
    
    document.getElementById("settingsForm").addEventListener("submit", async function (event) {
      event.preventDefault();
    if (formDebounce) return
    formDebounce = true

      const formData = Object.fromEntries(new FormData(event.target).entries());
    
    let accountData = await fetch("/currentAccount?type="+formData.account_type.toLowerCase())
    if (accountData.ok) {
      accountData = await accountData.json()
      if (formData.account_type == "Doctor") currentDoctor = accountData
      else if (formData.account_type == "Patient") currentPatient = accountData
    } else return
    
      const notification = document.getElementById(
        formData.account_type + "_settings_notif"
      );

      const response = await fetch("/updateAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountData, formData }),
      });

      if (response.ok) {
        notification.textContent = "Successfully updated account details.";
        notification.className = "alert alert-success mt-3 rounded-3";
      } else {
        const error = await response.json();
        notification.textContent =
          error.message || "Failed to update account details.";
        notification.className = "alert alert-danger mt-3 rounded-3";
      }

      setTimeout(function () {
        if (notification.textContent.length > 0) {
          notification.textContent = "";
          notification.className = "";
          formDebounce = false
        }
      }, 3000);
    });

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
async function accountCreation() {
  document
      .getElementById("accountCreationForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();
        let btn = event.submitter;
        setLoading(btn, true);
        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );

        const response = await fetch("/createAccount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          notify("Account created", { type: "success", duration: 5000 });
          document.getElementById("accountCreationForm").reset();
        } else {
          const error = await response.json();
          notify(error.message || "Failed to create account", {
            type: "error",
            duration: 5000,
          });
        }
        setLoading(btn, false);
      });
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(adminSettings);
});
