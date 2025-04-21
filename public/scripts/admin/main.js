let ready = false;
let currentDoctor;

function waitUntilReady(callback) {
  if (ready === true && currentDoctor) {
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
    const selectedSectionNav = document.getElementById(section.id + "_nav");
    selectedSectionNav.classList.remove("active");
  });

  const selectedSection = document.getElementById(sectionId);
  selectedSection.style.display = "block";

  const selectedSectionNav = document.getElementById(sectionId + "_nav");
  selectedSectionNav.classList.add("active");
}

document.addEventListener("DOMContentLoaded", async function () {
  // Get current doctor
  currentDoctor = await fetch("/currentAccount");
  if (currentDoctor.ok) currentDoctor = await currentDoctor.json();
  else {
    let error = await currentDoctor.json();
    alert("No login session was found. Please login!");
    window.location.href = error.redirect;
    return;
  }

  let layouts = [
    "appointments",
    "settings",
  ];
  for (let i in layouts) {
    console.log(layouts[i]);
    let response = await fetch("../admin/layouts/" + layouts[i] + ".html");
    let data = await response.text();
    document.getElementById(layouts[i] + "_holder").innerHTML = data;
  }
  showSection("appointments");
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
