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
document.addEventListener("DOMContentLoaded", function() {
  showSection('dashboard')
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            // Remove the 'active' class from all nav items
            document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
            
            // Add the 'active' class to the clicked nav item
            this.classList.add('active');
        });
    });
});

