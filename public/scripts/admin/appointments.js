let appointmentsInitialized = false;

async function appointments() {}

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
