function getAppointmentDate(dayName) {
  const daysMapping = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
  };
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

async function loadPatientMedicalHistory() {
  try {
    const response = await fetch("/getPatientMedicalHistory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPatient }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch medical history.");
    }
    const data = await response.json();
    const appointments = data.appointments;

    const medHistoryBody = document.getElementById("medHistoryBody");
    medHistoryBody.innerHTML = ""; // Clear any previous rows

    // For each appointment, add a main row with date, doctor's name, and reason.
    appointments.forEach((app) => {
      const exactDate = app.appointment_date//getAppointmentDate(app.appointment_day);
      const row = document.createElement("tr");
      row.classList.add("MH_RowLabel");
      row.innerHTML = `
        <td>${exactDate ? exactDate : "N/A"}</td>
        <td>${app.appointment_time_schedule}</td>
        <td>Dr. ${app.doctor_info.first_name} ${app.doctor_info.last_name}</td>
        <td>${app.reason}</td>
      `;
      medHistoryBody.appendChild(row);

      // Add click event to toggle expanded details for this appointment
      row.addEventListener("click", function () {
        // If this row is already expanded, collapse it
        if (row.classList.contains("expanded")) {
          row.classList.remove("expanded");
          const nextRow = row.nextElementSibling;
          if (nextRow && nextRow.classList.contains("expanded-details")) {
            nextRow.remove();
          }
          // Restore display for any other rows if needed
          const allRows = document.querySelectorAll("#medHistoryBody tr");
          allRows.forEach((r) => (r.style.display = ""));
        } else {
          // Collapse any other expanded row first
          const expandedRow = document.querySelector(
            "#medHistoryBody tr.expanded"
          );
          if (expandedRow) {
            expandedRow.classList.remove("expanded");
            const nextRow = expandedRow.nextElementSibling;
            if (nextRow && nextRow.classList.contains("expanded-details")) {
              nextRow.remove();
            }
            const allRows = document.querySelectorAll("#medHistoryBody tr");
            allRows.forEach((r) => (r.style.display = ""));
          }
          // Mark the clicked row as expanded and hide others
          row.classList.add("expanded");
          const allRows = document.querySelectorAll("#medHistoryBody tr");
          allRows.forEach((r) => {
            if (r !== row) {
              r.style.display = "none";
            }
          });
          // Create an expanded details row using form-group structure
          const detailsRow = document.createElement("tr");
          detailsRow.classList.add("expanded-details");
          detailsRow.innerHTML = `
            <td colspan="4" style="padding: 0;">
              <div class="read-only-container">
              <header class="form-header">
              <h1>Medical Record</h1>
              </header>
                <div class="form-group row mb-1">
                  <label class="col-sm-3 col-form-label">Diagnosis:</label>
                  <div class="col-sm-9">
                    <input type="text" class="form-control" value="${
                      (app.medicalRecord && app.medicalRecord.diagnosis) ||
                      "N/A"
                    }" readonly />
                  </div>
                </div>
                <div class="form-group row mb-1">
                  <label class="col-sm-3 col-form-label">Treatment Plan:</label>
                  <div class="col-sm-9">
                    <input type="text" class="form-control" value="${
                      (app.medicalRecord && app.medicalRecord.treatment_plan) ||
                      "N/A"
                    }" readonly />
                  </div>
                </div>
                <div class="form-group row mb-1">
                  <label class="col-sm-3 col-form-label">Allergies:</label>
                  <div class="col-sm-9">
                    <input type="text" class="form-control" value="${
                      (app.medicalRecord && app.medicalRecord.allergies) ||
                      "N/A"
                    }" readonly />
                  </div>
                </div>
                <div class="form-group row mb-1">
                  <label class="col-sm-3 col-form-label">Medical History:</label>
                  <div class="col-sm-9">
                    <input type="text" class="form-control" value="${
                      (app.medicalRecord &&
                        app.medicalRecord.medical_history) ||
                      "N/A"
                    }" readonly />
                  </div>
                </div>
                <div class="text-center mt-2">
                  <button class="action-button close-details">Close</button>
                </div>
              </div>
            </td>
          `;
          // Insert the details row immediately after the clicked row
          row.parentNode.insertBefore(detailsRow, row.nextSibling);
          // Attach event to the Close button
          detailsRow
            .querySelector(".close-details")
            .addEventListener("click", function (e) {
              e.stopPropagation();
              row.classList.remove("expanded");
              detailsRow.remove();
              const allRows = document.querySelectorAll("#medHistoryBody tr");
              allRows.forEach((r) => (r.style.display = ""));
            });
        }
      });
    });

    // If no appointments exist, show a "No medical history" message
    if (appointments.length === 0) {
      medHistoryBody.innerHTML = `<tr><td colspan="4" class="text-center">No medical history yet! &#128578;</td></tr>`;
    }
  } catch (err) {
    console.error("Error fetching medical history:", err);
  }
}

// Initialize the patient medical history once DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(loadPatientMedicalHistory);
});
