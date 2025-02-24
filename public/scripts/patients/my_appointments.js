let myAppointmentsInitialized = false;

async function myAppointments() {
  if (myAppointmentsInitialized) return
  myAppointmentsInitialized = true
  
  let formDebounce = false
  document.getElementById("createAppointmentsForm").addEventListener("submit", async function (event) {
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
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(myAppointments);
});