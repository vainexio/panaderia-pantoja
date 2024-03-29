// scripts.js

document.addEventListener('DOMContentLoaded', () => {
  const orderTableBody = document.getElementById('order-table-body');

  // Function to fetch orders from the server
  const fetchOrders = async () => {
    try {
      const response = await fetch('/purchase-orders');
      const orders = await response.json();
      populateTable(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Function to populate the table with orders
  const populateTable = (orders) => {
    orderTableBody.innerHTML = '';
    orders.forEach((order) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.referenceCode}</td>
        <td>${order.itemName}</td>
        <td>${order.pendingAmount}</td>
        <td>${order.description}</td>
        <td>
          <button class="edit-btn" data-id="${order._id}">Edit</button>
          <button class="delete-btn" data-id="${order._id}">Delete</button>
        </td>
      `;
      orderTableBody.appendChild(row);
    });
  };

  // Fetch orders when the page loads
  fetchOrders();
});