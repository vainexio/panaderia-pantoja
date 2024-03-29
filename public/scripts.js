document.addEventListener('DOMContentLoaded', () => {
  const orderTableBody = document.getElementById('order-table-body');
  const orderForm = document.getElementById('order-form');

  // Function to fetch orders from the server
  const fetchOrders = async () => {
    try {
      const response = await fetch('/purchase-orders');
      const orders = await response.json();
      console.log(orders)
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

  // Function to handle form submission
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(orderForm);
    const orderData = {
      referenceCode: formData.get('referenceCode'),
      itemName: formData.get('itemName'),
      pendingAmount: formData.get('pendingAmount'),
      description: formData.get('description')
    };

    try {
      const response = await fetch('/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const newOrder = await response.json();
        populateTable([newOrder]);
        orderForm.reset();
      } else {
        console.error('Failed to add order:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding order:', error);
    }
  });

  // Fetch orders when the page loads
  fetchOrders();
});