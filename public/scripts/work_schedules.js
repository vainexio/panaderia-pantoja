function fetchSchedules() {
  fetch('/schedules')
    .then(response => response.json())
    .then(schedules => {
      let tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
      `;
      schedules.forEach(schedule => {
        tableHTML += `
          <tr class="schedule-data" data-id="${schedule._id}">
            <td>${schedule.day_of_week}</td>
            <td>${schedule.start_time}</td>
            <td>${schedule.end_time}</td>
            <td>
              <button class="edit-btn btn btn-sm btn-outline-light" title="Edit Schedule">
                <i class="bi bi-pencil-fill"></i>
              </button>
              <button class="delete-btn btn btn-sm btn-outline-light" title="Delete Schedule">
                <i class="bi bi-trash-fill"></i>
              </button>
            </td>
          </tr>
        `;
      });
      tableHTML += `</tbody></table>`;
      document.querySelector('.work-schedules-card').innerHTML = tableHTML;
    })
    .catch(err => console.error('Error fetching schedules:', err));
  
  
// Handle form submission to create a new schedule
document.getElementById('scheduleForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const day_of_week = document.getElementById('day_of_week').value;
  const start_time = document.getElementById('start_time').value;
  const end_time = document.getElementById('end_time').value;

  fetch('/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ day_of_week, start_time, end_time })
  })
  .then(response => response.json())
  .then(data => {
    // Optionally, show a notification to the user here.
    fetchSchedules(); // Refresh the schedule table
    // Clear form fields if desired:
    document.getElementById('scheduleForm').reset();
  })
  .catch(err => console.error('Error creating schedule:', err));
});

document.querySelector('.work-schedules-card').addEventListener('click', function(e) {
  // Delete schedule
  if(e.target.closest('.delete-btn')) {
    const scheduleRow = e.target.closest('tr');
    const id = scheduleRow.getAttribute('data-id');

    fetch('/schedule/' + id, { method: 'DELETE' })
      .then(() => fetchSchedules())
      .catch(err => console.error('Error deleting schedule:', err));
  }

  // Edit schedule (you may want to open a modal or inline form for editing)
  if(e.target.closest('.edit-btn')) {
    const scheduleRow = e.target.closest('tr');
    const id = scheduleRow.getAttribute('data-id');

    // Example: prompt the user for new times (for demo purposes)
    const newDay = prompt("Enter new day:", scheduleRow.children[0].innerText);
    const newStart = prompt("Enter new time-in:", scheduleRow.children[1].innerText);
    const newEnd = prompt("Enter new time-out:", scheduleRow.children[2].innerText);

    if(newDay && newStart && newEnd) {
      fetch('/schedule/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: newDay,
          start_time: newStart,
          end_time: newEnd
        })
      })
      .then(() => fetchSchedules())
      .catch(err => console.error('Error updating schedule:', err));
    }
  }
});
}

// Load the schedule list when the page loads
document.addEventListener("DOMContentLoaded", async function () {
  function isReady() {
    fetchSchedules();
  }
  
  // Wait for content load (ensure waitUntilReady is defined or replace with your own ready check)
  waitUntilReady(isReady);
});
