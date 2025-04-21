let selectedUserType = "";
document.addEventListener("DOMContentLoaded", async function () {
  const errorMessageElement = document.getElementById("error-message");
  const button = document.getElementById("loginButton");

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    button.disabled = true;
    errorMessageElement.style.display = "none";

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = data.redirect;
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
});
