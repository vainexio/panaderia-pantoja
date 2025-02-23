async function patientRegistration() {
  if (!window.patientRegistrationFormAttached) {
    window.patientRegistrationFormAttached = true;
    document
      .getElementById("genPassword")
      .addEventListener("click", async function (e) {
        function generateRandomPassword(length = 12) {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          let password = "";
          for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return password;
        }
        const randomPassword = generateRandomPassword();
        const password = document.getElementById("password");
        const confirmPassword = document.getElementById("confirm_password");

        password.type = "text";
        confirmPassword.type = "text";
        password.value = randomPassword;
        confirmPassword.value = randomPassword;

        setTimeout(function () {
          password.type = "password";
          confirmPassword.type = "password";
        }, 500);
      });

    document
      .getElementById("patientForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );
        const notification = document.getElementById("patient_regis_notif");

        const response = await fetch("/registerPatient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          notification.textContent = "Patient account registered successfully!";
          notification.className = "alert alert-success mt-3 rounded-3";
        } else {
          const error = await response.json();
          notification.textContent =
            error.message || "Failed to register patient.";
          notification.className = "alert alert-danger mt-3 rounded-3";
        }

        setTimeout(function () {
          if (notification.textContent.length > 0) {
            notification.textContent = "";
            notification.className = "";
          }
        }, 3000);
      });
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  // Wait for content load
  waitUntilReady(patientRegistration);
});
