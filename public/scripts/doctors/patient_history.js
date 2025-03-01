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

function showPatientDetails(patient) {
  // Create an expanded details container
  const detailsContainer = document.createElement("div");
  detailsContainer.id = "patientDetailsExpanded";
  detailsContainer.innerHTML = `
    <header class="form-header mt-5">
      <h1>Patient Details</h1>
    </header>
    <div class="read-only-container mb-4">
      <div class="form-group row">
        <label class="col-sm-3 col-form-label">Name:</label>
        <div class="col-sm-9">
          <input type="text" class="form-control" value="${patient.name}" readonly />
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-3 col-form-label">Sex:</label>
        <div class="col-sm-9">
          <input type="text" class="form-control" value="${patient.sex}" readonly />
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-3 col-form-label">Birthdate:</label>
        <div class="col-sm-9">
          <input type="text" class="form-control" value="${patient.birthdate}" readonly />
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-3 col-form-label">Contact Number:</label>
        <div class="col-sm-9">
          <input type="text" class="form-control" value="${patient.contact_number}" readonly />
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-3 col-form-label">Email:</label>
        <div class="col-sm-9">
          <input type="text" class="form-control" value="${patient.email}" readonly />
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-3 col-form-label">Emergency Contact:</label>
        <div class="col-sm-9">
          <input type="text" class="form-control" value="${patient.emergency_contact_name || "None"}" readonly />
        </div>
      </div>
      <div class="form-group row">
        <label class="col-sm-3 col-form-label">Emergency Contact Number:</label>
        <div class="col-sm-9">
          <input type="text" class="form-control" value="${patient.emergency_contact_number || "None"}" readonly />
        </div>
      </div>
    </div>
    <header class="form-header mt-5">
      <h1>Appointment History</h1>
    </header>
    <div id="appointmentsHistoryContainer" class="mb-4"></div>
    <div class="text-center">
      <button id="backToListBtn" type="button" class="btn btn-primary">Back to Patient List</button>
    </div>
  `;

  // Append the details container to the main patient history container
  const container = document.querySelector(".PHContainer");
  container.appendChild(detailsContainer);

  // For each appointment, create its own appointment table and its own medical record table
  const appointmentsContainer = document.getElementById("appointmentsHistoryContainer");
  if (patient.appointments && patient.appointments.length > 0) {
    patient.appointments.forEach(app => {
      // Compute the exact appointment date using your helper function
      const exactDate = getAppointmentDate(app.appointment_day);

      // Create a table for appointment data
      const appointmentTable = document.createElement("table");
      appointmentTable.style.setProperty("border", "2px solid #283986", "important");
      appointmentTable.className = "table table-bordered table-striped w-100 mb-0 mt-5";
      appointmentTable.innerHTML = `
        <thead class="thead-light">
        <tr>
        <th style="background-color: #283986 !important; color: white !important;" colspan="3" class="text-center">Appointment on ${exactDate ? exactDate.toLocaleDateString() : "N/A"} (${app.appointment_day})</th>
        </tr>

          <tr>
            <th>Time Schedule</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${app.appointment_time_schedule}</td>
            <td>${app.reason}</td>
            <td>${app.status}</td>
          </tr>
        </tbody>
      `;
      appointmentsContainer.appendChild(appointmentTable);

      // Create a separate table for the medical record for this appointment
      const mrTable = document.createElement("table");
      mrTable.style.setProperty("border", "2px solid #283986", "important");
      mrTable.className = "table table-bordered table-striped w-100 mb-8";
      
      let mrContent = ``;
      // Check if there are multiple records or a single record
      if (Array.isArray(app.medicalRecords) && app.medicalRecords.length > 0) {
        app.medicalRecords.forEach(rec => {
          mrContent += `
            <tr>
              <td>${rec.diagnosis || "N/A"}</td>
              <td>${rec.treatment_plan || "N/A"}</td>
              <td>${rec.allergies || "N/A"}</td>
              <td>${rec.medical_history || "N/A"}</td>
            </tr>
          `;
        });
      } else if (app.medicalRecord) {
        mrContent += `
          <tr>
            <td>${app.medicalRecord.diagnosis || "N/A"}</td>
            <td>${app.medicalRecord.treatment_plan || "N/A"}</td>
            <td>${app.medicalRecord.allergies || "N/A"}</td>
            <td>${app.medicalRecord.medical_history || "N/A"}</td>
          </tr>
        `;
      } else {
        mrContent = `<tr><td colspan="4" class="text-center">No Medical Record Found</td></tr>`;
      }
      
      mrTable.innerHTML = `
        <thead class="thead-light">
        <tr>
        <th colspan="4" class="text-center">Medical Record</th>
        </tr>
          <tr>
            <th>Diagnosis</th>
            <th>Treatment Plan</th>
            <th>Allergies</th>
            <th>Medical History</th>
          </tr>
        </thead>
        <tbody>
          ${mrContent}
        </tbody>
      `;
      appointmentsContainer.appendChild(mrTable);
    });
  } else {
    appointmentsContainer.innerHTML = `<p class="text-center">No appointment history found.</p>`;
  }

  // Attach "Back to Patient List" button event to collapse the expanded view and restore the patient list
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