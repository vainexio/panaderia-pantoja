let myAppointmentsInitialized = false;

async function myAppointments() {
  if (myAppointmentsInitialized) return
  myAppointmentsInitialized = true
  
  document.getElementById("create_app_first_name").value = currentPatient.first_name;
  document.getElementById("create_app_last_name").value = currentPatient.last_name;
  document.getElementById("create_app_contact_num").value = currentPatient.contact_number;
  document.getElementById("create_app_sex").value = currentPatient.sex;
  let formDebounce = false
  document.getElementById("createAppointmentsForm").addEventListener("submit", async function (event) {
      event.preventDefault();
    if (formDebounce) return
    formDebounce = true
    
    const formData = Object.fromEntries(new FormData(event.target).entries());
    const notification = document.getElementById("my_appointments_notif");
    
      const response = await fetch("/createAppointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPatient, formData }),
      });

      if (response.ok) {
        notification.textContent = "Successfully created appointment.";
        notification.className = "alert alert-success mt-3 rounded-3";
      } else {
        const error = await response.json();
        notification.textContent =
          error.message || "Failed to create appointment.";
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