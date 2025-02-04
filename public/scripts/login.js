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
    errorMessageElement.style.display = "none"; // Hide error message on retry

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, userType: selectedUserType }),
        });

        const data = await response.json();

        if (response.ok) {
           window.location.href = data.redirect
            /*const redirectResponse = await fetch(data.redirect, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ securityKey: data.key }),
            });

            const htmlContent = await redirectResponse.text();
            document.open();
            document.write(htmlContent);
            document.close();*/
        } else {
            errorMessageElement.textContent = data.error || "Invalid credentials.";
            errorMessageElement.style.display = "block";
        }
    } catch (error) {
        console.error("Error:", error);
        errorMessageElement.textContent = "An error occurred. Please try again.";
        errorMessageElement.style.display = "block";
    } finally {
        button.disabled = false;
    }
});