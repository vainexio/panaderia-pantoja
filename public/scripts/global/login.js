let selectedUserType = "";

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
document.addEventListener("DOMContentLoaded", async function () {
  let currentAdmin = await fetch("/currentAccount");
  if (currentAdmin.ok) {
    currentAdmin = await currentAdmin.json();
    window.location.href = "/admin-dashboard";
    return;
  }
  const errorMessageElement = document.getElementById("error-message");
  const button = document.getElementById("loginButton");

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    button.disabled = true;
    setLoading(btn,true);
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
        setLoading(btn,false);
        errorMessageElement.textContent = data.error || "Invalid credentials.";
        errorMessageElement.style.display = "block";
      }
    } catch (error) {
      setLoading(btn,false);
      console.error("Error:", error);
      errorMessageElement.textContent = "An error occurred. Please try again.";
      errorMessageElement.style.display = "block";
    } finally {
      setLoading(btn,false);
      button.disabled = false;
    }
  });
});
