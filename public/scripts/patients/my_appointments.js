let myAppointmentsInitialized = false;

async function myAppointments() {
  // Populate the patient info fields
  document.getElementById("create_app_first_name").value = currentPatient.first_name;
  document.getElementById("create_app_last_name").value = currentPatient.last_name;
  document.getElementById("create_app_contact_num").value = currentPatient.contact_number;
  
  let formDebounce = false;
  
  // Fetch and render appointments
  fetch("/appointments")
    .then((response) => response.json())
    .then((data) => {
      const appointmentsData = data.appointments;
      const tableBody = document.querySelector(".appointment-table-container table tbody");
      tableBody.innerHTML = ""; // Clear existing rows

      appointmentsData.forEach((app) => {
        // Create a new table row with a cancel button if status is Pending Confirmation
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${app.exact_date} (${app.appointment_day})</td>
          <td>${app.appointment_time_schedule}</td>
          <td>Dr. ${app.doctor_name}</td>
          <td>${app.reason}</td>
          <td>${app.status}</td>
          <td>${app.status === "Pending Confirmation" ? `<button class="btn btn-sm btn-danger cancel-btn" data-id="${app.appointment_id}">Cancel</button>` : ''}</td>
        `;
        tableBody.appendChild(row);

        // Attach cancel button event if present
        if (app.status === "Pending Confirmation") {
          const cancelBtn = row.querySelector(".cancel-btn");
          cancelBtn.addEventListener("click", async () => {
            const confirmation = confirm("Are you sure you want to cancel this appointment?");
            if (!confirmation) return;
            
            try {
              const cancelResponse = await fetch(`/cancelAppointment/${app.appointment_id}`, {
                method: "DELETE"
              });
              if (cancelResponse.ok) {
                alert("Appointment cancelled successfully.");
                myAppointments(); // Refresh appointments list
              } else {
                const errorData = await cancelResponse.json();
                alert(errorData.message || "Failed to cancel appointment.");
              }
            } catch (error) {
              console.error("Error cancelling appointment:", error);
              alert("Error cancelling appointment.");
            }
          });
        }
      });
    })
    .catch((err) => {
      console.error("Error fetching appointments:", err);
    });
  
  // Filter day select options so that past days of this week are removed
  const daySelect = document.getElementById("create_app_day");
  const now = new Date();
  const dayMapping = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
  const currentDay = now.getDay(); // getDay(): Sunday=0, Monday=1, etc.
  
  if (currentDay >= 1 && currentDay <= 5) {
    const options = Array.from(daySelect.options);
    options.forEach((option) => {
      if (option.value && dayMapping[option.value] < currentDay) {
        option.remove();
      }
    });
  }
  
  // Add submit listener if not already attached
  if (!myAppointmentsInitialized) {
    myAppointmentsInitialized = true;
    document.getElementById("createAppointmentsForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();
        if (formDebounce) return;
        formDebounce = true;

        const formData = Object.fromEntries(new FormData(event.target).entries());
        const notification = document.getElementById("my_appointments_notif");

        let response = await fetch("/createAppointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPatient, formData }),
        });

        if (response.ok) {
          response = await response.json();
          notification.textContent = response.message;
          notification.className = "alert alert-success mt-3 rounded-3";
        } else {
          const error = await response.json();
          notification.textContent = error.message || "Failed to create appointment.";
          notification.className = "alert alert-danger mt-3 rounded-3";
        }
        myAppointments();

        setTimeout(function () {
          notification.textContent = "";
          notification.className = "";
          formDebounce = false;
        }, 3000);
      });
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(myAppointments);
});
