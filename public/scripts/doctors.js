function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    selectedSection.style.display = 'block';
}

// Show the home section by default
document.addEventListener("DOMContentLoaded", async function() {
  
  let layouts = [
    'work_schedule',
    'appointments',
    'patient_history',
    'patient_registration',
    'analytics',
    'settings',
    'navbar',
  ]
  for (let i in layouts) {
    console.log(layouts[i])
    let response = await fetch('../layouts/'+layouts[i]+'.html')
    let data = await response.text();
    document.getElementById(layouts[i]+'_holder').innerHTML = data
  }
  showSection('work_schedule')
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
  
  document.getElementById('patientForm').addEventListener('submit', async function(event) {
      event.preventDefault();

      const formData = Object.fromEntries(new FormData(event.target).entries());
      const notification = document.getElementById('notification');
      notification.classList.add('d-none');

      try {
        const response = await fetch('/registerPatient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          notification.textContent = 'Patient account registered successfully!';
          notification.className = 'alert alert-success mt-3 rounded-3';
        } else {
          const error = await response.json();
          notification.textContent = error.message || 'Failed to register patient.';
          notification.className = 'alert alert-danger mt-3 rounded-3';
        }
        
        setTimeout(function() {
          notification.classList.add('d-none');
        },5000)
      } catch (err) {
        notification.textContent = err//'An error occurred. Please try again later.';
        notification.className = 'alert alert-danger mt-3 rounded-3';
      } finally {
        notification.classList.remove('d-none');
      }
    });
});
