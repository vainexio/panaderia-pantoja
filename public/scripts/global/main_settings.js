async function removeSession(sessionId, callback) {
  try {
    const response = await fetch("/removeSession", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (response.ok) {
      console.log("Session removed successfully");
      // Refresh
      callback();
    } else {
      console.error("Failed to remove session");
    }
  } catch (error) {
    console.error("Error removing session:", error);
  }
}
async function removeOtherSessions(accountId, type, callback) {
  try {
    const response = await fetch("/removeOtherSessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, type }),
    });
    if (response.ok) {
      console.log("All sessions removed successfully");
      callback();
    } else {
      console.error("Failed to remove other sessions");
    }
  } catch (error) {
    console.error("Error removing other sessions:", error);
  }
}

async function mainSettings() {
  document
    .getElementById("settingsForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const formData = Object.fromEntries(new FormData(event.target).entries());

      let accountData =
        formData.account_type == "Doctor"
          ? currentDoctor
          : formData.account_type == "Patient"
          ? currentPatient
          : null;
      const notification = document.getElementById("doc_settings_notif");

      const response = await fetch("/updateAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountData, formData }),
      });

      setTimeout(function () {
        if (notification.textContent.length > 0) {
          notification.textContent = "";
          notification.className = "";
        }
      }, 3000);
    });
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(mainSettings);
});
