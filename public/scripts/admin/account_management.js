async function accountManagement() {
  document
    .getElementById("accountCreationForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      let btn = event.submitter;
      setLoading(btn, true);
      const formData = Object.fromEntries(new FormData(event.target).entries());

      const response = await fetch("/createAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        notify("Account created", { type: "success", duration: 5000 });
        document.getElementById("accountCreationForm").reset();
      } else {
        const error = await response.json();
        notify(error.message || "Failed to create account", {type: "error",duration: 5000,});
      }
      setLoading(btn, false);
    });
}
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(accountManagement);
});