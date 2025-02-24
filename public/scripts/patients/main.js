let ready = false;
let currentPatient;

function waitUntilReady(callback) {
  if (ready === true) {
    callback();
  } else {
    setTimeout(() => waitUntilReady(callback), 100);
  }
}
function showSection(sectionId) {
  const sections = document.querySelectorAll(".section-content");
  sections.forEach((section) => {
    section.style.display = "none";
    const selectedSectionNav = document.getElementById(section.id+"_nav");
    selectedSectionNav.classList.remove("active")
  });

  const selectedSection = document.getElementById(sectionId);
  selectedSection.style.display = "block";
  
  const selectedSectionNav = document.getElementById(sectionId+"_nav");
  selectedSectionNav.classList.add("active")
}

document.addEventListener("DOMContentLoaded", async function () {
  // Get current doctor
  currentPatient = await fetch("/currentAccount?type=patient")
  if (currentPatient.ok) currentPatient = await currentPatient.json()
  else {
    let error = await currentPatient.json()
    alert("No login session was found. Please login!");
    window.location.href = error.redirect;
    return;
  }
  let layouts = [
    "clinic_hours",
    "my_appointments",
    "medical_records",
    "settings",
  ];
  for (let i in layouts) {
    console.log(layouts[i]);
    let response = await fetch("../patient/layouts/" + layouts[i] + ".html");
    let data = await response.text();
    document.getElementById(layouts[i] + "_holder").innerHTML = data;
  }
  showSection("my_appointments");
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function () {
      document
        .querySelectorAll(".nav-link")
        .forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");
    });
  });
  ready = true;
  /* Hide loader */
  setTimeout(() => {
    document.getElementById("preloader").classList.add("fade-out");
  }, 500);
});
