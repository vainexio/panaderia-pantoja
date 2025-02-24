let myAppointmentsInitialized = false;

async function myAppointments() {
  document.getElementById("create_app_first_name").value =
    currentPatient.first_name;
  document.getElementById("create_app_last_name").value =
    currentPatient.last_name;
  document.getElementById("create_app_contact_num").value =
    currentPatient.contact_number;
  let formDebounce = false;
  //
  fetch("/appointments")
    .then((response) => response.json())
    .then((data) => {
      const appointments = data.appointments;
      const tableBody = document.querySelector(
        ".appointment-table-container table tbody"
      );
      tableBody.innerHTML = ""; // Clear existing rows

      appointments.forEach((app) => {
        // Create a new table row
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${app.exact_date} (${app.appointment_day})</td>
          <td>${app.appointment_time_schedule}</td>
          <td>${app.doctor_name}</td>
          <td>${app.reason}</td>
          <td>${app.status}</td>
          <td><!-- Actions can be added here --></td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch((err) => {
      console.error("Error fetching appointments:", err);
    });
  //
  const daySelect = document.getElementById("create_app_day");
  const now = new Date();

  // Define a mapping for Monday-Friday to a numeric value.
  const dayMapping = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };
  // Get today's day number (if today is Monday-Friday, getDay() returns 1-5)
  const currentDay = now.getDay();

  // Only filter if today is between Monday (1) and Friday (5)
  if (currentDay >= 1 && currentDay <= 5) {
    // Iterate over the <option> elements
    const options = Array.from(daySelect.options);
    options.forEach((option) => {
      if (option.value && dayMapping[option.value] < currentDay) {
        // Remove options for days that are earlier in the week than today.
        option.remove();
      }
    });
  }
  if (!myAppointmentsInitialized) {
    myAppointmentsInitialized = true;
    document
      .getElementById("createAppointmentsForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();
        if (formDebounce) return;
        formDebounce = true;

        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );
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
          notification.textContent =
            error.message || "Failed to create appointment.";
          notification.className = "alert alert-danger mt-3 rounded-3";
        }
        myAppointments();

        setTimeout(function () {
          if (notification.textContent.length > 0) {
            notification.textContent = "";
            notification.className = "";
            formDebounce = false;
          }
        }, 3000);
      });
  }
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(myAppointments);
});
