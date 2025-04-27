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
async function removeOtherSessions(accountId, callback) {
  try {
    const response = await fetch("/removeOtherSessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
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
  if (mainSettingsInitialized) return;
  mainSettingsInitialized = true;
  
  let toggleDebounce = false
  let formDebounce = false
  document.getElementById('toggle-password-btn').addEventListener('click', function() {
    if (toggleDebounce) return
    toggleDebounce = true
    var passwordFields = document.getElementById('password-fields');
    var inputs = passwordFields.querySelectorAll('input');
    
    if (passwordFields.style.display === "none" || passwordFields.style.display === "") {
      passwordFields.style.display = "block";
      this.innerText = "Cancel";
      inputs.forEach(input => input.disabled = false);
    }
    else {
      passwordFields.style.display = "none";
      this.innerText = "Change Password";
      inputs.forEach(input => input.disabled = true);
    }
    
    setTimeout(function() {
      toggleDebounce = false
    },500)
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(mainSettings);
});