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
    medHistoryBody.innerHTML = "";

    appointments.forEach((app) => {
      const exactDate = app.appointment_date;
      const row = document.createElement("tr");
      row.classList.add("MH_RowLabel");
      row.innerHTML = `
        <td>${exactDate ? exactDate : "N/A"}</td>
        <td>${app.appointment_time_schedule}</td>
        <td>Dr. ${app.doctor_info.first_name} ${app.doctor_info.last_name}</td>
        <td>${app.reason}</td>
      `;
      medHistoryBody.appendChild(row);

      row.addEventListener("click", function () {
        if (row.classList.contains("expanded")) {
          row.classList.remove("expanded");
          const nextRow = row.nextElementSibling;
          if (nextRow && nextRow.classList.contains("expanded-details")) {
            nextRow.remove();
          }
          const allRows = document.querySelectorAll("#medHistoryBody tr");
          allRows.forEach((r) => (r.style.display = ""));
        } else {
          const expandedRow = document.querySelector("#medHistoryBody tr.expanded");
          if (expandedRow) {
            expandedRow.classList.remove("expanded");
            const nextRow = expandedRow.nextElementSibling;
            if (nextRow && nextRow.classList.contains("expanded-details")) {
              nextRow.remove();
            }
            const allRows = document.querySelectorAll("#medHistoryBody tr");
            allRows.forEach((r) => (r.style.display = ""));
          }
          row.classList.add("expanded");
          const allRows = document.querySelectorAll("#medHistoryBody tr");
          allRows.forEach((r) => {
            if (r !== row) {
              r.style.display = "none";
            }
          });
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
                      (app.medicalRecord && app.medicalRecord.medical_history) ||
                      "N/A"
                    }" readonly />
                  </div>
                </div>
                <div class="text-center mt-2">
                  <button class="action-button med-cert">Download Medical Certificate</button>
                  <button class="action-button close-details">Close</button>
                </div>
              </div>
            </td>
          `;
          row.parentNode.insertBefore(detailsRow, row.nextSibling);

          // Add event listener for the Med Cert button
          detailsRow.querySelector(".med-cert").addEventListener("click", function (e) {
            e.stopPropagation();
            generateAndDownloadMedCert(app)
            console.log("Med Cert button clicked for appointment:", app);
          });

          // Event listener for the Close button
          detailsRow.querySelector(".close-details").addEventListener("click", function (e) {
            e.stopPropagation();
            row.classList.remove("expanded");
            detailsRow.remove();
            const allRows = document.querySelectorAll("#medHistoryBody tr");
            allRows.forEach((r) => (r.style.display = ""));
          });
        }
      });
    });

    if (appointments.length === 0) {
      medHistoryBody.innerHTML = `<tr><td colspan="4" class="text-center">No medical history yet! &#128578;</td></tr>`;
    }
  } catch (err) {
    console.error("Error fetching medical history:", err);
  }
}

// Helper function to fetch an image and convert it to a base64 data URL
async function getBase64ImageFromURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function generateAndDownloadMedCert(record) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // URL of the image you want to include
  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/NU_shield.svg/1200px-NU_shield.svg.png";

  // Convert the image from URL to base64
  const base64data = await getBase64ImageFromURL(imageUrl);

  // Define image dimensions and placement
  const pageWidth = doc.internal.pageSize.getWidth();
  const imageWidth = 30; // Adjust as needed
  const imageHeight = 33; // Adjust as needed
  const imageX = (pageWidth - imageWidth) / 2;
  const imageY = 5; // Top margin for the image

  // Add the image to the PDF
  doc.addImage(base64data, "PNG", imageX, imageY, imageWidth, imageHeight);

  // Calculate new starting Y for header texts (placing them below the image)
  const baseY = imageY + imageHeight + 10;

  doc.setFontSize(16);
  doc.text("NU Laguna", 105, baseY, { align: "center" });
  doc.setFontSize(14);
  doc.text("Medical Certificate", 105, baseY + 10, { align: "center" });
  doc.setFontSize(10);
  
  // Prepare the certificate content segments
  const segments = [
    { text: "This is to certify that ", isData: false },
    { text: `${currentPatient.first_name} ${currentPatient.last_name}`, isData: true },
    { text: " (Student ID: ", isData: false },
    { text: `${currentPatient.patient_id}`, isData: true },
    { text: ") was examined on ", isData: false },
    { text: `${record.appointment_date || "N/A"}`, isData: true },
    { text: " and was diagnosed with ", isData: false },
    { text: `${(record.medicalRecord && record.medicalRecord.diagnosis) || "N/A"}`, isData: true },
    { text: ". The treatment plan recommended is ", isData: false },
    { text: `${(record.medicalRecord && record.medicalRecord.treatment_plan) || "N/A"}`, isData: true },
    { text: ". The patient reported allergies: ", isData: false },
    { text: `${(record.medicalRecord && record.medicalRecord.allergies) || "N/A"}`, isData: true },
    { text: ", with a medical history including ", isData: false },
    { text: `${(record.medicalRecord && record.medicalRecord.medical_history) || "N/A"}`, isData: true },
    { text: ". The attending physician is Dr. ", isData: false },
    { text: `${record.doctor_info.first_name} ${record.doctor_info.last_name}`, isData: true },
    { text: ".", isData: false },
  ];

  // Set starting coordinates for the certificate content
  let x = 20;
  let y = baseY + 30; // Starting Y position for the certificate body
  const maxWidth = doc.internal.pageSize.getWidth() - 40;
  const lineHeight = 10;

  segments.forEach(segment => {
    // Use bold font for dynamic data and normal for static text
    if (segment.isData) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.text(segment.text, x, y);
    const segmentWidth = doc.getTextWidth(segment.text);
    // Underline dynamic data for emphasis
    if (segment.isData) {
      doc.line(x, y + 1, x + segmentWidth, y + 1);
    }
    x += segmentWidth;
    // Wrap text if exceeding the page width
    if (x > maxWidth) {
      y += lineHeight;
      x = 20;
    }
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("This certificate is issued for academic purposes.", 105, y + 20, { align: "center" });
  
  // Save the PDF
  doc.save(`${currentPatient.first_name}${currentPatient.last_name}_MedCert.pdf`);
}

document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(loadPatientMedicalHistory);
});
