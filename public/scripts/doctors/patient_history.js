
async function patient_history() {
  if (!patientHistoryInitialized) {
    patientHistoryInitialized = true
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(patient_history);
});