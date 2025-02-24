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

let mainSettingsInitialized = false;

async function mainSettings() {
  // Prevent duplicate listener registration
  if (mainSettingsInitialized) return;
  mainSettingsInitialized = true;

  document.getElementById('toggle-password-btn').addEventListener('click', function() {
    var passwordFields = document.getElementById('password-fields');
    var inputs = passwordFields.querySelectorAll('input');
    
    // Toggle display and disabled attribute
    if (passwordFields.style.display === "none" || passwordFields.style.display === "") {
      passwordFields.style.display = "block";
      this.innerText = "Cancel";
      inputs.forEach(input => input.disabled = false);
    } else {
      passwordFields.style.display = "none";
      this.innerText = "Change Password";
      inputs.forEach(input => input.disabled = true);
    }
  });

  document.getElementById("settingsForm").addEventListener("submit", async function (event) {
      event.preventDefault();

      const formData = Object.fromEntries(new FormData(event.target).entries());

      let accountData =
        formData.account_type == "Doctor"
          ? currentDoctor
          : formData.account_type == "Patient"
          ? currentPatient
          : null;
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
        }
      }, 3000);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(mainSettings);
});