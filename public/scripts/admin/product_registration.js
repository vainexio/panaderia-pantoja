async function deleteCategory(catName, callback) {
  try {
    let response = await fetch("/deleteCategory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catName }),
    });
    if (response.ok) {
      notify("Category deleted", { type: "success", duration: 5000 });
      // Refresh
      callback();
    } else {
      response = await response.json();
      notify(response.error, { type: "error", duration: 5000 });
    }
  } catch (error) {
    console.error("Error removing category:", error);
  }
}
async function displayCategories() {
  let response = await fetch("/getCategories");
  if (response.ok) {
    response = await response.json();
    let categoryList = "";

    let tableHTML = `
      <div class="table-responsive">
        <table class="table table-striped table-transparent">
          <thead class="thead-dark">
            <tr>
              <th scope="col">Category Name</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (let i in response) {
      let cat = response[i];
      console.log(cat._id.toString());
      categoryList += `<option value="${
        cat.category_id
      }">${cat.name.toUpperCase()}</option>`;
      const button = `<button class="btn btn-sm btn-danger remove-cat-btn" cat-name="${cat.name}">Delete</button>`;

      tableHTML += `
        <tr cat-name="${cat.name}">
        <td>${cat.name.toUpperCase()}</td>
        <td>
        ${button}
        </td>
        </tr>
        `;
    }
    tableHTML += `
      </tbody>
      </table>
      </div>
      `;
    document.querySelector(".categories-card").innerHTML = tableHTML;

    let categoryGroup = document.getElementById("category-group");
    categoryGroup.innerHTML = `
      <div class="form-group">
        <label for="product_category">Category</label>
        <select id="product_category" name="product_category" required>
        <option value="">${
          response.length > 0 ? "Select Category" : "Create a Category First"
        }</option>
        ${categoryList}
        </select>
      </div>
      `;

    document.querySelectorAll(".remove-cat-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const current = this.getAttribute("cat-name");
        setLoading(button, true);
        await deleteCategory(current, displayCategories);
        setLoading(button, false);
      });
    });
  }
}
async function productRegistration() {
  if (!window.productRegistrationFormAttached) {
    window.productRegistrationFormAttached = true;

    document
      .getElementById("productForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();
        const btn = event.submitter;
        setLoading(btn, true);
        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );
        const response = await fetch("/createProduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          notify("Product registered", { type: "success", duration: 5000 });
          document.getElementById("productForm").reset();
          setLoading(btn, false);
          loadInventory(false,true);
        } else {
          const error = await response.json();
          notify(error.message || "Failed to register product.", {
            type: "error",
            duration: 5000,
          });
          setLoading(btn, false);
        }
      });

    document
      .getElementById("categoryForm")
      .addEventListener("submit", async function (event) {
        event.preventDefault();
        const btn = event.submitter;
        setLoading(btn, true);
        const formData = Object.fromEntries(
          new FormData(event.target).entries()
        );

        const response = await fetch("/createCategory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          notify("Category created", { type: "success", duration: 5000 });
          displayCategories();
          setLoading(btn, false);
        } else {
          const error = await response.json();
          notify(error.message || "Failed to create category.", {
            type: "error",
            duration: 5000,
          });
          setLoading(btn, false);
        }
        document.getElementById("categoryForm").reset();
      });

    displayCategories();
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(productRegistration);
});
