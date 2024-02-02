
<script>
  
  const response = await fetch('/admin/getOrders');
    const orders = await response.json();
  // JavaScript code to populate stocks list
  const stocksList = document.getElementById('stocksList');
  <% for (const stock of stocks) { %>
    const stockItem = document.createElement('li');
    stockItem.textContent = '<%= stock.name %> - <%= stock.availability %> - Amount: <%= stock.amount %> - Price: $<%= stock.price %>';
    stocksList.appendChild(stockItem);
  <% } %>

  // JavaScript code to populate pending orders list
  const ordersList = document.getElementById('ordersList');
  <% for (const order of orders) { %>
    const orderItem = document.createElement('li');
    orderItem.textContent = '<%= order.itemName %> - <%= order.orderStatus %> - Price: $<%= order.price %>';
    ordersList.appendChild(orderItem);
  <% } %>
</script>