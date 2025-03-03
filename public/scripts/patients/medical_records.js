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

    if (appointments.length === 0) {
      medHistoryBody.innerHTML = `<tr><td colspan="5" class="text-center">No medical history yet! &#128578;</td></tr>`;
      return;
    }

    appointments.forEach((app) => {
      // Use the stored appointment_date directly.
      const exactDate = app.appointment_date;
      const row = document.createElement("tr");
      row.classList.add("MH_RowLabel");
      row.innerHTML = `
        <td>${exactDate ? exactDate : "N/A"}</td>
        <td>${(app.medicalRecord && app.medicalRecord.diagnosis) || "N/A"}</td>
        <td>${(app.medicalRecord && app.medicalRecord.treatment_plan) || "N/A"}</td>
        <td>Dr. ${app.doctor_info.first_name} ${app.doctor_info.last_name}</td>
        <td><button class="btn btn-sm btn-primary med-cert-btn">Med Cert</button></td>
      `;
      medHistoryBody.appendChild(row);

      // Attach event listener to the "Med Cert" button
      row.querySelector(".med-cert-btn").addEventListener("click", function(e) {
        e.stopPropagation();
        generateMedicalCertificateForRecord(app);
      });
    });
  } catch (err) {
    console.error("Error fetching medical history:", err);
  }
}

function generateMedicalCertificateForRecord(record) {
  // Ensure jsPDF is available from the global window.jspdf namespace.
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header: University details & Certificate title
  doc.setFontSize(16);
  doc.text("University of Example", 105, 15, { align: "center" });
  doc.setFontSize(14);
  doc.text("Medical Certificate", 105, 25, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 105, 35, { align: "center" });
  
  // Certificate body:
  doc.setFontSize(12);
  doc.text("This is to certify that:", 20, 50);
  doc.text(`Name: ${currentPatient.first_name} ${currentPatient.last_name}`, 20, 60);
  doc.text(`Student ID: ${currentPatient.patient_id}`, 20, 70);
  doc.text(`Date of Examination: ${record.appointment_date || "N/A"}`, 20, 80);
  doc.text(`Diagnosis: ${(record.medicalRecord && record.medicalRecord.diagnosis) || "N/A"}`, 20, 90);
  doc.text(`Treatment Plan: ${(record.medicalRecord && record.medicalRecord.treatment_plan) || "N/A"}`, 20, 100);
  doc.text(`Allergies: ${(record.medicalRecord && record.medicalRecord.allergies) || "N/A"}`, 20, 110);
  doc.text(`Medical History: ${(record.medicalRecord && record.medicalRecord.medical_history) || "N/A"}`, 20, 120);
  doc.text(`Attending Physician: Dr. ${record.doctor_info.first_name} ${record.doctor_info.last_name}`, 20, 130);
  doc.text("Signature: _____________________", 20, 140);
  doc.setFontSize(10);
  doc.text("This certificate is issued for academic purposes.", 105, 150, { align: "center" });

  // Output the PDF as a Data URI string and display it in the medCerfContainer.
  const dataUriString = doc.output("datauristring");
  document.querySelector(".medCerfContainer").innerHTML = `
    <iframe src="${dataUriString}" width="100%" height="500px" style="border: none;"></iframe>
  `;
}

document.addEventListener("DOMContentLoaded", function () {
  waitUntilReady(loadPatientMedicalHistory);
});