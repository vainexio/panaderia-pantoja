let myAppointmentsInitialized = false;

async function myAppointments() {
  document.getElementById("create_app_first_name").value =
    currentPatient.first_name;
  document.getElementById("create_app_last_name").value =
    currentPatient.last_name;
  document.getElementById("create_app_contact_num").value =
    currentPatient.contact_number;

  let formDebounce = false;

  fetch("/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPatient,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const appointmentsData = data.appointments;
      const tableBody = document.querySelector(
        ".appointment-table-container table tbody"
      );
      tableBody.innerHTML = "";

      appointmentsData.forEach((app) => {
        const statusColor =
          app.status === "Pending"
            ? "🟠"
            : app.status === "Completed"
            ? "🟢"
            : app.status === "Cancelled"
            ? "🔴"
            : "❓";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${app.exact_date} (${app.appointment_day})</td>
          <td>${
            app.appointment_time_schedule +
            (app.appointment_time_schedule == "Morning"
              ? " (7AM - 12PM)"
              : app.appointment_time_schedule == "Afternoon"
              ? " (1PM - 4PM)"
              : "")
          }</td>
          <td>Dr. ${app.doctor_name}</td>
          <td>${app.reason}</td>
          <td>${statusColor} ${app.status}</td>
          <td>${
            app.status === "Pending"
              ? `<button class="btn btn-sm btn-danger cancel-btn" data-id="${app.appointment_id}">Cancel</button>`
              : ""
          }</td>
        `;
        tableBody.appendChild(row);

        if (app.status === "Pending") {
          const cancelBtn = row.querySelector(".cancel-btn");
          cancelBtn.addEventListener("click", async () => {
            const confirmation = confirm(
              "Are you sure you want to cancel this appointment?"
            );
            if (!confirmation) return;

            try {
              const cancelResponse = await fetch(
                `/cancelAppointment/${app.appointment_id}`,
                {
                  method: "DELETE",
                }
              );
              if (cancelResponse.ok) {
                myAppointments();
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

  const daySelect = document.getElementById("create_app_day");
  const now = new Date();
  const dayMapping = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };
  const currentDay = now.getDay();

  if (currentDay >= 1 && currentDay <= 5) {
    const options = Array.from(daySelect.options);
    options.forEach((option) => {
      if (option.value && dayMapping[option.value] < currentDay) {
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
