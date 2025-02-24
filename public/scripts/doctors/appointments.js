let appointmentsInitialized = false;

async function appointments() {
  if (!appointmentsInitialized) {
    appointmentsInitialized = true;

    try {
      const response = await fetch("/getDoctorAppointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentDoctor })
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch appointments.");
      }
      
      const data = await response.json();
      const appointmentsData = data.appointments;
      
      // Assuming your HTML has a table with a <tbody id="doctorAppointmentsTableBody">
      const tableBody = document.getElementById("doctorAppointmentsTableBody");
      tableBody.innerHTML = ""; // Clear any existing content
      
      appointmentsData.forEach((app) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${app.exact_date} (${app.appointment_day})</td>
          <td>${app.appointment_time_schedule}</td>
          <td>${app.patient_name}</td>
          <td>${app.reason}</td>
          <td>${app.status}</td>
        `;
        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Error fetching doctor appointments:", err);
    }
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(appointments);
});
