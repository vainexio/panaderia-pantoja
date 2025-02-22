let ready = false
function waitUntilReady(callback) {
  if (ready === true) {
    callback();
  } else {
    setTimeout(() => waitUntilReady(callback), 100);
  }
}
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
    'clinic_hours',
    'my_appointments',
    'medical_records',
    'settings',
  ]
  for (let i in layouts) {
    console.log(layouts[i])
    let response = await fetch('../patient/layouts/'+layouts[i]+'.html')
    let data = await response.text();
    document.getElementById(layouts[i]+'_holder').innerHTML = data
  }
  showSection('my_appointments')
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
  /* */
  ready = true
  /* Hide loader */
  setTimeout(() => {
    document.getElementById("preloader").classList.add("fade-out");
  }, 500);
});
