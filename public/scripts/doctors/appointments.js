let appointmentsInitialized = false;

async function appointments() {
  const patientSearchInput = document.getElementById("patientSearchInput");
  const statusFilterSelect = document.getElementById("statusFilterSelect");
  const patientSearch = patientSearchInput
    ? patientSearchInput.value.trim()
    : "";
  const statusFilter = statusFilterSelect ? statusFilterSelect.value : "All";

  try {
    const response = await fetch("/getDoctorAppointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentDoctor, statusFilter, patientSearch }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch appointments.");
    }

    const data = await response.json();
    const appointmentsData = data.appointments;

    // Populate the table
    const tableBody = document.getElementById("doctorAppointmentsTableBody");
    tableBody.innerHTML = "";

    appointmentsData.forEach((app) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${app.exact_date} (${app.appointment_day})</td>
          <td>${app.appointment_time_schedule}</td>
          <td>${app.patient_name}</td>
          <td>${app.reason}</td>
          <td>
            <div class="form-group2">
              <label>${app.status}</label>
              <select class="status-select" data-id="${app.appointment_id}">
                <option value="">Change</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </td>
          <td>
            <button class="action-button start-btn" data-id="${app.appointment_id}">View Appointment</button>
          </td>
        `;
      tableBody.appendChild(row);

      // Handle status update
      const statusSelect = row.querySelector(".status-select");
      statusSelect.addEventListener("change", async function () {
        const newStatus = this.value;
        const appointment_id = this.getAttribute("data-id");
        if (newStatus) {
          try {
            const updateRes = await fetch("/updateAppointmentStatus", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ appointment_id, newStatus }),
            });
            const updateData = await updateRes.json();
            appointments();
            loadPatientHistory();
          } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status");
          }
        }
      });

      const startBtn = row.querySelector(".start-btn");
      startBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        const appointment_id = this.getAttribute("data-id");
        const clickedRow = this.closest("tr");
        const allRows = document.querySelectorAll(
          "#doctorAppointmentsTableBody tr"
        );
        allRows.forEach((row) => {
          if (row !== clickedRow) {
            row.style.display = "none";
          }
        });

        try {
          const startRes = await fetch("/startAppointment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointment_id }),
          });
          const startData = await startRes.json();

          document.getElementById("mr_appointment_id").value =
            startData.appointment.appointment_id;
          document.getElementById("mr_patient_id").value =
            startData.appointment.patient_id;
          document.getElementById("mr_doctor_id").value =
            currentDoctor.doctor_id;

          document.getElementById("app_patient_name").value =
            startData.appointment.patient_name;
          document.getElementById("app_patient_contact").value =
            startData.appointment.contact_number;
          document.getElementById("app_patient_email").value =
            startData.appointment.email;
          document.getElementById("app_patient_birthdate").value =
            startData.appointment.birthdate;
          document.getElementById("app_patient_sex").value =
            startData.appointment.sex;
          document.getElementById("app_patient_er_contact").value =
            startData.appointment.emergency_contact;

          if (startData.medicalRecord) {
            document.getElementById("mr_diagnosis").value =
              startData.medicalRecord.diagnosis;
            document.getElementById("mr_treatment_plan").value =
              startData.medicalRecord.treatment_plan;
            document.getElementById("mr_allergies").value =
              startData.medicalRecord.allergies;
            document.getElementById("mr_medical_history").value =
              startData.medicalRecord.medical_history;
          } else {
            document.getElementById("mr_diagnosis").value = "";
            document.getElementById("mr_treatment_plan").value = "";
            document.getElementById("mr_allergies").value = "";
            document.getElementById("mr_medical_history").value = "";
          }
          document.getElementById("appointmentModal").style.display = "block";
          document
            .getElementById("appointmentModal")
            .classList.add("appointmentModal");
        } catch (err) {
          console.error("Error starting appointment:", err);
          alert("Failed to start appointment");
        }
      });
    });
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
  }

  if (!appointmentsInitialized) {
    appointmentsInitialized = true;
    document
      .getElementById("medicalRecordForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const payload = Object.fromEntries(formData.entries());
        try {
          const res = await fetch("/saveMedicalRecord", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const resData = await res.json();
          const statusRes = await fetch("/updateAppointmentStatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointment_id: payload.appointment_id,
              newStatus: "Completed",
            }),
          });
          const statusData = await statusRes.json();

          closeModal();
          appointments();
          loadPatientHistory();
        } catch (err) {
          console.error("Error saving medical record:", err);
          alert("Failed to save medical record");
        }
      });

    document
      .getElementById("applyFiltersBtn")
      .addEventListener("click", function () {
        appointmentsInitialized = false;
        appointments();
      });
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(appointments);
});

function closeModal() {
  document.getElementById("appointmentModal").style.display = "none";
  const allRows = document.querySelectorAll("#doctorAppointmentsTableBody tr");
  allRows.forEach((row) => {
    row.style.display = "";
  });
}
