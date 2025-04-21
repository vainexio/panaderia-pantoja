async function productRegistration() {
  if (!window.productRegistrationFormAttached) {
    window.productRegistrationFormAttached = true;

    document
      .getElementById("productForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );
        const notification = document.getElementById("regis_notif");

        const response = await fetch("/registerProduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          notification.textContent = "Product registered successfully!";
          notification.className = "alert alert-success mt-3 rounded-3";
        } else {
          const error = await response.json();
          notification.textContent =
            error.message || "Failed to register product.";
          notification.className = "alert alert-danger mt-3 rounded-3";
        }
        document.getElementById("productForm").reset();

        setTimeout(function () {
          if (notification.textContent.length > 0) {
            notification.textContent = "";
            notification.className = "";
          }
        }, 2000);
      });
    
    const response = await fetch("/getCategories");
    if (response.ok) {
      response = await response.json()
      let categoryList = ""
      for (let ctg in response) {
        categoryList += "
          <option value="days">Day(s)</option>
          <option value="months">Month(s)</option>
          <option value="years">Year(s)</option>"
      }
      let categoryGroup = document.getElementById('category-group')
      categoryGroup.innerHTML = `
      <div class="form-group">
        <label for="product_category">Category</label>
        <select id="product_category" name="product_category" required>
        </select>
      </div>
      `
    }
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(productRegistration);
});
