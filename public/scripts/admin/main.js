let ready = false;
let currentAdmin;
function setLoading(button, isLoading) {
  let isBlack = button.matches(".black-loading")
  if (isLoading) {
    button.classList.add("loading");
    if (isBlack) {
      button.classList.add("black");
    }
  } else {
    button.classList.remove("loading");
    if (isBlack) {
      button.classList.remove("black");
    }
  }
}
function waitUntilReady(callback) {
  if (ready === true && currentAdmin) {
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
  // Get current account
  currentAdmin = await fetch("/currentAccount");
  if (currentAdmin.ok) currentAdmin = await currentAdmin.json();
  else {
    let error = await currentAdmin.json();
    alert("No login session was found. Please login!");
    window.location.href = error.redirect;
    return;
  }

  let layouts = ["dashboard", "inventory", "product_registration", "account_management", "settings"];
  for (let i in layouts) {
    console.log(layouts[i]);
    let response = await fetch("../admin/layouts/" + layouts[i] + ".html");
    let data = await response.text();
    document.getElementById(layouts[i] + "_holder").innerHTML = data;
  }
  showSection("inventory");
  
  if (currentAdmin.userLevel < 3) {
    const accsNav = document.getElementById("account_management_nav");
    accsNav.style.display = "none";
  }
  if (currentAdmin.userLevel < 2) {
    const productCreationNav = document.getElementById("product_registration_nav");
    productCreationNav.style.display = "none";
  }
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
  document.getElementById("preloader").classList.add("fade-out");
});