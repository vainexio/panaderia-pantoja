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
    
    document
      .getElementById("categoryForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );
        const notification = document.getElementById("regis_notif");

        const response = await fetch("/createCategory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          notification.textContent = "Category created successfully!";
          notification.className = "alert alert-success mt-3 rounded-3";
        } else {
          const error = await response.json();
          notification.textContent =
            error.message || "Failed to create category.";
          notification.className = "alert alert-danger mt-3 rounded-3";
        }
        document.getElementById("categoryForm").reset();

        setTimeout(function () {
          if (notification.textContent.length > 0) {
            notification.textContent = "";
            notification.className = "";
          }
        }, 2000);
      });
    
    let response = await fetch("/getCategories");
    if (response.ok) {
      response = await response.json()
      let categoryList = ""
      
        console.log(response)
      for (let i in response) {
        let cat = response[i]
        categoryList += `<option value="${cat.name.toLowerCase()}">${cat.name}</option>`
      }
      let categoryGroup = document.getElementById('category-group')
      categoryGroup.innerHTML = `
      <div class="form-group">
        <label for="product_category">Category</label>
        <select id="product_category" name="product_category" required>
        <option value="">${response.length > 0 ? "Select Category" : "Create a Category First"}</option>
        ${categoryList}
        </select>
      </div>
      `
    }
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(productRegistration);
});
