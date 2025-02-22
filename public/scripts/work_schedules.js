// Helper function to convert "7:00 PM" or "7:00 AM" to "19:00" or "07:00"
function convertTo24Hour(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(' ');
  if (parts.length < 2) return timeStr; // already in proper format or unexpected format
  let [time, modifier] = parts;
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier.toLowerCase() === 'pm' && hours !== 12) {
    hours += 12;
  }
  if (modifier.toLowerCase() === 'am' && hours === 12) {
    hours = 0;
  }
  // Ensure hours are in two-digit format
  const hoursStr = hours < 10 ? '0' + hours : hours.toString();
  return `${hoursStr}:${minutes}`;
}

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
      .then(async response => {
        const notification = document.getElementById('notification');
        // Hide the notification initially
        notification.classList.add('d-none');

        if (response.ok) {
          notification.textContent = 'Work schedule created!';
          notification.className = 'alert alert-success mt-3 rounded-3';
          notification.classList.remove('d-none');
          fetchSchedules(); // Refresh the schedule table
          document.getElementById('scheduleForm').reset();
        } else {
          const error = await response.json();
          notification.textContent = error.message || 'Failed to create work schedule.';
          notification.className = 'alert alert-danger mt-3 rounded-3';
          notification.classList.remove('d-none');
        }
      })
      .catch(err => {
        const notification = document.getElementById('notification');
        notification.textContent = 'Error creating schedule: ' + err.message;
        notification.className = 'alert alert-danger mt-3 rounded-3';
        notification.classList.remove('d-none');
        console.error('Error creating schedule:', err);
      });
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
  
      // Edit schedule: read updated values from input/select elements
      if (e.target.closest('.edit-btn')) {
        const scheduleRow = e.target.closest('tr');
        const id = scheduleRow.getAttribute('data-id');

        // Retrieve the updated values from the inputs/selects
        const newDay = scheduleRow.querySelector('.edit-day').value;
        const newStart = scheduleRow.querySelector('.edit-start').value;
        const newEnd = scheduleRow.querySelector('.edit-end').value;
  
        fetch('/schedule/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day_of_week: newDay,
            start_time: newStart,
            end_time: newEnd
          })
        })
        .then(() => {
          fetchSchedules()
          alert('Schedule updated successfully!');
        })
        .catch(err => console.error('Error updating schedule:', err));
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
            <td>
              <select class="edit-day form-select">
                <option value="Monday" ${schedule.day_of_week === 'Monday' ? 'selected' : ''}>Monday</option>
                <option value="Tuesday" ${schedule.day_of_week === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
                <option value="Wednesday" ${schedule.day_of_week === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
                <option value="Thursday" ${schedule.day_of_week === 'Thursday' ? 'selected' : ''}>Thursday</option>
                <option value="Friday" ${schedule.day_of_week === 'Friday' ? 'selected' : ''}>Friday</option>
              </select>
            </td>
            <td>
              <input type="time" class="edit-start form-control" value="${convertTo24Hour(schedule.start_time)}">
            </td>
            <td>
              <input type="time" class="edit-end form-control" value="${convertTo24Hour(schedule.end_time)}">
            </td>
            <td>
              <button class="edit-btn btn btn-sm btn-outline-dark" title="Update Schedule">
                <i class="bi bi-floppy-fill"></i>
              </button>
              <button class="delete-btn btn btn-sm btn-outline-dark" title="Delete Schedule">
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
});
