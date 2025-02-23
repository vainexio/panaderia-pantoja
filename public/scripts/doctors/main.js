let ready = false;
let currentDoctor;

function waitUntilReady(callback) {
  if (ready === true) {
    callback();
  } else {
    setTimeout(() => waitUntilReady(callback), 100);
  }
}
function sleep(miliseconds) {
  var currentTime = new Date().getTime();
  while (currentTime + miliseconds >= new Date().getTime()) {}
}
function showSection(sectionId) {
  const sections = document.querySelectorAll(".section-content");
  sections.forEach((section) => {
    section.style.display = "none";
  });

  const selectedSection = document.getElementById(sectionId);
  selectedSection.style.display = "block";
}

document.addEventListener("DOMContentLoaded", async function () {
  let layouts = [
    "work_schedule",
    "appointments",
    "patient_history",
    "patient_registration",
    "analytics",
    "settings",
  ];
  for (let i in layouts) {
    console.log(layouts[i]);
    let response = await fetch("../doctor/layouts/" + layouts[i] + ".html");
    let data = await response.text();
    document.getElementById(layouts[i] + "_holder").innerHTML = data;
  }
  showSection("work_schedule");
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function () {
      document
        .querySelectorAll(".nav-link")
        .forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");
    });
  });
  
  // Get current doctor
  currentDoctor = await fetch("/currentDoctor")
  if (currentDoctor.ok) currentDoctor = await currentDoctor.json()
  else {
    console.log('Current doctor was not found!')
  }
  
  ready = true;
  /* Hide loader */
  setTimeout(() => {
    document.getElementById("preloader").classList.add("fade-out");
  }, 500);
});
