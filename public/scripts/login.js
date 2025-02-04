let selectedUserType = "";

const doctorButton = document.getElementById("doctorButton");
const patientButton = document.getElementById("patientButton");
const errorMessageElement = document.getElementById("error-message");

const button = document.getElementById("loginButton");

doctorButton.addEventListener("click", () => {
    selectedUserType = "doctor";
    doctorButton.classList.add("selected");
    patientButton.classList.remove("selected");
});

patientButton.addEventListener("click", () => {
    selectedUserType = "patient";
    patientButton.classList.add("selected");
    doctorButton.classList.remove("selected");
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!selectedUserType) {
        errorMessageElement.textContent = "Please select a user type (doctor/patient).";
        errorMessageElement.style.display = "block";
        return;
    }
    button.disabled = true;

    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, userType: selectedUserType }),
    })
        .then((response) => response.json())
        .then((data) => {
            fetch("/doctors").then
            button.disabled = false;
        })
        .catch((error) => {
            console.error("Error:", error);
            button.disabled = false;
        });
});