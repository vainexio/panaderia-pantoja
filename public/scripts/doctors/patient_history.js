let patientHistoryInitialized = false

async function loadPatientHistory() {
  if (patientHistoryInitialized) return
  patientHistoryInitialized = true
  try {
    const response = await fetch("/getPatientHistory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentDoctor }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch patient history.");
    }
    const data = await response.json();
    const patients = data.patients;

    const tableBody = document.querySelector(".PH_TableInput");
    tableBody.innerHTML = ""; // Clear existing rows

    patients.forEach(patient => {
      const row = document.createElement("tr");
      row.classList.add("PH_TableRow");
      row.innerHTML = `
        <td class="PH_TableData">${patient.name}</td>
        <td class="PH_TableData">${patient.sex}</td>
        <td class="PH_TableData">${patient.birthdate}</td>
        <td class="PH_TableData">${patient.contact_number}</td>
        <td class="PH_TableData">${patient.email}</td>
      `;
      // When the row is clicked, hide others and show detailed view
      row.addEventListener("click", function () {
  // Check if another row is already expanded
  const expandedRow = document.querySelector(".PH_TableInput .PH_TableRow.expanded");
  if (expandedRow && expandedRow !== row) {
    // Collapse the previously expanded row
    expandedRow.classList.remove("expanded");
    const detailsContainer = document.getElementById("patientDetailsExpanded");
    if (detailsContainer) {
      detailsContainer.remove();
    }
    // Restore display for all rows before expanding the clicked row
    const allRows = document.querySelectorAll(".PH_TableInput .PH_TableRow");
    allRows.forEach(r => (r.style.display = ""));
  }

  // Toggle the clicked row
  if (row.classList.contains("expanded")) {
    // If clicked row is already expanded, collapse it
    row.classList.remove("expanded");
    const detailsContainer = document.getElementById("patientDetailsExpanded");
    if (detailsContainer) {
      detailsContainer.remove();
    }
    // Restore all rows
    const allRows = document.querySelectorAll(".PH_TableInput .PH_TableRow");
    allRows.forEach(r => (r.style.display = ""));
  } else {
    // Expand the clicked row
    row.classList.add("expanded");
    // Hide all other rows
    const allRows = document.querySelectorAll(".PH_TableInput .PH_TableRow");
    allRows.forEach(r => {
      if (r !== row) {
        r.style.display = "none";
      }
    });
    // Show detailed information for the clicked patient
    showPatientDetails(patient);
  }
});

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error fetching patient history:", err);
  }
}

// Show expanded details for a patient using read-only form groups
function showPatientDetails(patient) {
  // Create an expanded details container
  const detailsContainer = document.createElement("div");
  detailsContainer.id = "patientDetailsExpanded";
  detailsContainer.innerHTML = `
    <header class="form-header mt-5">
          <h1>Patient Details</h1>
        </header>
    <form class="medical-record-form">
    <div class="form-group">
      <label>Name:</label>
      <input type="text" value="${patient.name}" readonly />
    </div>
    <div class="form-group">
      <label>Sex:</label>
      <input type="text" value="${patient.sex}" readonly />
    </div>
    <div class="form-group">
      <label>Birthdate:</label>
      <input type="text" value="${patient.birthdate}" readonly />
    </div>
    <div class="form-group">
      <label>Contact Number:</label>
      <input type="text" value="${patient.contact_number}" readonly />
    </div>
    <div class="form-group">
      <label>Email:</label>
      <input type="text" value="${patient.email}" readonly />
    </div>
    <div class="form-group">
      <label>Emergency Contact:</label>
      <input type="text" value="${patient.emergency_contact_name || "None"}" readonly />
    </div>
    <div class="form-group">
      <label>Emergency Contact Number:</label>
      <input type="text" value="${patient.emergency_contact_number || "None"}" readonly />
    </div>
    </form>
    <header class="form-header mt-5">
          <h1>Appointment History</h1>
        </header>
    <div id="appointmentsHistoryContainer"></div>
    <div class="submit-container">
    <button id="backToListBtn" type="submit" class="action-button">Back to Patient List</button>
    </div>
  `;

  // Append the details container to the main patient history container
  const container = document.querySelector(".PHContainer");
  container.appendChild(detailsContainer);

  // Populate appointment history
  const appointmentsContainer = document.getElementById("appointmentsHistoryContainer");
  if (patient.appointments && patient.appointments.length > 0) {
    patient.appointments.forEach(app => {
      // Compute exact date using a helper function (see below)
      const exactDate = getAppointmentDate(app.appointment_day);
      const appDiv = document.createElement("div");
      appDiv.classList.add("appointment-details");
      appDiv.innerHTML = `
      <header class="form-header mb-0 mt-4">
          <p>Appointment on ${exactDate ? exactDate.toLocaleDateString() : "N/A"} (${app.appointment_day})</p>
        </header>
        <form class="medical-record-form">
        <div class="form-group">
          <label>Time Schedule:</label>
          <input type="text" value="${app.appointment_time_schedule}" readonly />
        </div>
        <div class="form-group">
          <label>Reason:</label>
          <input type="text" value="${app.reason}" readonly />
        </div>
        <div class="form-group">
          <label>Status:</label>
          <input type="text" value="${app.status}" readonly />
        </div>
        </form>
      `;
      if (app.medicalRecord) {
        appDiv.innerHTML += `
          <header class="form-header mt-5">
          <h1>Medical Record</h1>
        </header>
          <form class="medical-record-form">
          <div class="form-group">
            <label>Diagnosis:</label>
            <input type="text" value="${app.medicalRecord.diagnosis || ''}" readonly />
          </div>
          <div class="form-group">
            <label>Treatment Plan:</label>
            <input type="text" value="${app.medicalRecord.treatment_plan || ''}" readonly />
          </div>
          <div class="form-group">
            <label>Allergies:</label>
            <input type="text" value="${app.medicalRecord.allergies || ''}" readonly />
          </div>
          <div class="form-group">
            <label>Medical History:</label>
            <input type="text" value="${app.medicalRecord.medical_history || ''}" readonly />
          </div>
          </form>
        `;
      }
      appointmentsContainer.appendChild(appDiv);
    });
  } else {
    appointmentsContainer.innerHTML = `<p>No appointment history found.</p>`;
  }

  // Attach "Back" button event to remove expanded view and restore the table
  document.getElementById("backToListBtn").addEventListener("click", function () {
    detailsContainer.remove();
    const allRows = document.querySelectorAll(".PH_TableInput .PH_TableRow");
    allRows.forEach(r => r.style.display = "");
  });
}

// Helper function: compute exact date for the current week based on day name
function getAppointmentDate(dayName) {
  const daysMapping = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4 };
  if (!(dayName in daysMapping)) return null;
  const now = new Date();
  let monday;
  if (now.getDay() === 0) {
    monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else {
    const diff = now.getDay() - 1;
    monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  }
  const appointmentDate = new Date(monday);
  appointmentDate.setDate(monday.getDate() + daysMapping[dayName]);
  return appointmentDate;
}


document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(loadPatientHistory);
});