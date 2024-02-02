// Get all elements with class "tab" and hide them
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => tab.style.display = 'none');

// Get all elements with class "content" and set their width
const content = document.querySelector('.content');
content.style.width = '80%';

// Show the default tab (assuming the first tab is the default)
tabs[0].style.display = 'block';

// Function to switch between tabs
function openTab(tabName) {
    tabs.forEach(tab => tab.style.display = 'none');
    document.getElementById(tabName).style.display = 'block';
}

// Add click event listeners to tab buttons
document.getElementById('orders-btn').addEventListener('click', () => openTab('orders'));
document.getElementById('dashboard-btn').addEventListener('click', () => openTab('dashboard'));
document.getElementById('pending-orders-btn').addEventListener('click', () => openTab('pending-orders'));
document.getElementById('stocks-btn').addEventListener('click', () => openTab('stocks'));
// Add click event listeners to other tab buttons

// Add animation to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#4CAF50'; // Change color on hover
    });

    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#008CBA'; // Change color back on mouseout
    });
});