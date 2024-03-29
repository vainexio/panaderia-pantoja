document.addEventListener('DOMContentLoaded', () => {
  const orderTableBody = document.getElementById('order-table-body');
  const orderForm = document.getElementById('order-form');

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
        <td>${order.deliveredAmount}</td>
        <td>${order.description}</td>
        <td>
          <button class="edit-btn" data-id="${order._id}">Edit</button>
          <button class="delete-btn" data-id="${order._id}">Delete</button>
        </td>
      `;
      orderTableBody.appendChild(row);

      // Add event listener for edit button
      const editButton = row.querySelector('.edit-btn');
      editButton.addEventListener('click', () => handleEditOrder(order._id));

      // Add event listener for delete button
      const deleteButton = row.querySelector('.delete-btn');
      deleteButton.addEventListener('click', () => handleDeleteOrder(order._id));
    });
  };

  // Function to handle edit order
const handleEditOrder = async (orderId) => {
  try {
    // Fetch the order details from the server
    const response = await fetch(`/purchase-orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }
    const order = await response.json();

    // Display a form for editing the order details
    const updatedDeliveredAmount = prompt('Enter updated pending amount:', order.deliveredAmount);

    // Update the order details in the database
    const updatedOrderData = {
      referenceCode: order.referenceCode,
      itemName: order.itemName,
      pendingAmount: order.pendingAmount,
      deliveredAmount: updatedDeliveredAmount ? updatedDeliveredAmount : order.deliveredAmount,
      description: order.description,
    };

    const updateResponse = await fetch(`/purchase-orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedOrderData)
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update order');
    }

    // Fetch the updated order details from the server
    const updatedOrderResponse = await fetch(`/purchase-orders/${orderId}`);
    if (!updatedOrderResponse.ok) {
      throw new Error('Failed to fetch updated order details');
    }
    const updatedOrder = await updatedOrderResponse.json();

    // Update the order in the table
    const rowToUpdate = document.querySelector(`[data-id="${orderId}"]`).parentNode.parentNode;
    rowToUpdate.innerHTML = `
      <td>${updatedOrder.referenceCode}</td>
      <td>${updatedOrder.itemName}</td>
      <td>${updatedOrder.pendingAmount}</td>
      <td>${updatedOrder.deliveredAmount}</td>
      <td>${updatedOrder.description}</td>
      <td>
        <button class="edit-btn" data-id="${updatedOrder._id}">Edit</button>
        <button class="delete-btn" data-id="${updatedOrder._id}">Delete</button>
      </td>
    `;
  } catch (error) {
    console.error('Error editing order:', error);
  }
};

  // Function to handle delete order
  const handleDeleteOrder = async (orderId) => {
    try {
      const response = await fetch(`/purchase-orders/${orderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove the deleted order from the table
        const rowToDelete = document.querySelector(`[data-id="${orderId}"]`).parentNode.parentNode;
        rowToDelete.remove();
      } else {
        console.error('Failed to delete order:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  // Function to handle form submission
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(orderForm);
    const orderData = {
      referenceCode: formData.get('referenceCode'),
      itemName: formData.get('itemName'),
      pendingAmount: formData.get('pendingAmount'),
      deliveredAmount: formData.get('deliveredAmount'),
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
        populateTable(newOrder);
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