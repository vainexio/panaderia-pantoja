function fetchSchedules() {
  // Wait until the scheduleForm element is available
  if (!document.getElementById('scheduleForm')) {
    setTimeout(fetchSchedules, 100);
    return;
  }

  // Attach event listeners only once (using a flag)
  if (!window.scheduleFormAttached) {
    window.scheduleFormAttached = true;

    // Handle form submission to create a new schedule
    document.getElementById('scheduleForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const day_of_week = document.getElementById('day_of_week').value;
      const start_time = document.getElementById('start_time').value;
      const end_time = document.getElementById('end_time').value;
  
      fetch('/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week, start_time, end_time })
      })
      .then(response => response.json())
      .then(data => {
        fetchSchedules(); // Refresh the schedule table
        document.getElementById('scheduleForm').reset();
      })
      .catch(err => console.error('Error creating schedule:', err));
    });
    
    // Attach event listener for delete and edit buttons on the schedule table
    document.querySelector('.work-schedules-card').addEventListener('click', function(e) {
      // Delete schedule
      if (e.target.closest('.delete-btn')) {
        const scheduleRow = e.target.closest('tr');
        const id = scheduleRow.getAttribute('data-id');
  
        fetch('/schedule/' + id, { method: 'DELETE' })
          .then(() => fetchSchedules())
          .catch(err => console.error('Error deleting schedule:', err));
      }
  
      // Edit schedule (using prompt for demonstration)
      if (e.target.closest('.edit-btn')) {
        const scheduleRow = e.target.closest('tr');
        const id = scheduleRow.getAttribute('data-id');
  
        const newDay = prompt("Enter new day:", scheduleRow.children[0].innerText);
        const newStart = prompt("Enter new time-in:", scheduleRow.children[1].innerText);
        const newEnd = prompt("Enter new time-out:", scheduleRow.children[2].innerText);
  
        if (newDay && newStart && newEnd) {
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

  // Now fetch and render schedules
  fetch('/schedules')
    .then(response => response.json())
    .then(schedules => {
      let tableHTML = `
        <table class="table table-light table-striped w-100">
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
}

// When the document is loaded, call fetchSchedules (which will wait for scheduleForm)
document.addEventListener("DOMContentLoaded", async function () {
  waitUntilReady(fetchSchedules)
})
