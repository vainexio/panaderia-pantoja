async function adminSettings() {
  try {
    document.getElementById("doc_settings_first_name").value =
      currentAdmin.username;
    document.getElementById("doc_settings_id").value =
      currentAdmin.id;

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
      if (session.currentSession) {
        document.getElementById("doc_session_id").value = session.session_id;
      }
      const rowClass = session.currentSession ? "table-primary" : "";
      const button = !session.currentSession
        ? `<button class="btn btn-sm btn-danger remove-session-btn" data-session-id="${session.session_id}">Remove Device</button>`
        : `<button class="action-button remove-session-btn" current-session-id="${session.session_id}">Logout</button>`;

      tableHTML += `
            <tr data-session-id="${session.session_id}" class="${rowClass}">
              <td>${session.session_id+(session.currentSession ? "<i> (you)</i>" : "")}</td>
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
        setLoading(button,true);
        const current = this.getAttribute("current-session-id");
        if (current) {
          await removeSession(current, adminSettings);
          window.location = "/";
        } else {
          const sessionId = this.getAttribute("data-session-id");
          await removeSession(sessionId, adminSettings);
          notify("Device removed", { type: "success", duration: 5000 });
          setLoading(button,false);
        }
      });
    });

    const removeAllBtn = document.getElementById("remove-other-sessions");
    if (removeAllBtn) {
      removeAllBtn.addEventListener("click", async function () {
        setLoading(removeAllBtn,true);
        await removeOtherSessions(
          currentAdmin.id,
          adminSettings
        );
        notify("Other devices were removed", { type: "success", duration: 5000 });
        setLoading(removeAllBtn,false);
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(adminSettings);
});
