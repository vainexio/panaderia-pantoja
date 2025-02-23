function convertTo24Hour(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(" ");
  if (parts.length < 2) return timeStr;
  let [time, modifier] = parts;
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  if (modifier.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  }
  if (modifier.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }
  const hoursStr = hours < 10 ? "0" + hours : hours.toString();
  return `${hoursStr}:${minutes}`;
}

function fetchSchedules() {
  if (!document.getElementById("scheduleForm")) {
    setTimeout(fetchSchedules, 100);
    return;
  }

  if (!window.scheduleFormAttached) {
    window.scheduleFormAttached = true;

    document
      .getElementById("scheduleForm")
      .addEventListener("submit", async function (e) {
        e.preventDefault();

        const day_of_week = document.getElementById("day_of_week").value;
        const start_time = document.getElementById("start_time").value;
        const end_time = document.getElementById("end_time").value;
      const notification = document.getElementById("notification");
      
        let response = await fetch("/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day_of_week, start_time, end_time }) })
        if (response.ok) {
          response = await response.json();
          notification.textContent = "Work schedule created!";
          notification.className = "alert alert-success mt-3 rounded-3";
          fetchSchedules(); // Refresh the schedule table
          document.getElementById("scheduleForm").reset();
        } else {
          response = await response.json();
          notification.textContent = response.message || "Failed to create work schedule.";
          notification.className = "alert alert-danger mt-3 rounded-3";
        }
      
      setTimeout(function() {
        if (notification.textContent.length > 0) {
          notification.textContent = ""
          notification.className = ""
        }
      }, 3000)
      });

    document
      .querySelector(".work-schedules-card")
      .addEventListener("click", function (e) {
        // Delete schedule
        if (e.target.closest(".delete-btn")) {
          const scheduleRow = e.target.closest("tr");
          const id = scheduleRow.getAttribute("data-id");

          fetch("/schedule/" + id, { method: "DELETE" })
            .then(() => fetchSchedules())
            .catch((err) => console.error("Error deleting schedule:", err));
        }

        if (e.target.closest(".edit-btn")) {
          const scheduleRow = e.target.closest("tr");
          const id = scheduleRow.getAttribute("data-id");

          const newDay = scheduleRow.querySelector(".edit-day").value;
          const newStart = scheduleRow.querySelector(".edit-start").value;
          const newEnd = scheduleRow.querySelector(".edit-end").value;

          fetch("/schedule/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              day_of_week: newDay,
              start_time: newStart,
              end_time: newEnd,
            }),
          })
            .then(() => {
              fetchSchedules();
              alert("Schedule updated successfully!");
            })
            .catch((err) => console.error("Error updating schedule:", err));
        }
      });
  }

  fetch("/schedules")
    .then((response) => response.json())
    .then((schedules) => {
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
      schedules.forEach((schedule) => {
        tableHTML += `
          <tr class="schedule-data" data-id="${schedule._id}">
            <td>
              <select class="edit-day form-select">
                <option value="Monday" ${
                  schedule.day_of_week === "Monday" ? "selected" : ""
                }>Monday</option>
                <option value="Tuesday" ${
                  schedule.day_of_week === "Tuesday" ? "selected" : ""
                }>Tuesday</option>
                <option value="Wednesday" ${
                  schedule.day_of_week === "Wednesday" ? "selected" : ""
                }>Wednesday</option>
                <option value="Thursday" ${
                  schedule.day_of_week === "Thursday" ? "selected" : ""
                }>Thursday</option>
                <option value="Friday" ${
                  schedule.day_of_week === "Friday" ? "selected" : ""
                }>Friday</option>
                <option value="Friday" ${
                  schedule.day_of_week === "Saturday" ? "selected" : ""
                }>Saturday</option>
                <option value="Friday" ${
                  schedule.day_of_week === "Sunday" ? "selected" : ""
                }>Sunday</option>
              </select>
            </td>
            <td>
              <input type="time" class="edit-start form-control" value="${convertTo24Hour(
                schedule.start_time
              )}">
            </td>
            <td>
              <input type="time" class="edit-end form-control" value="${convertTo24Hour(
                schedule.end_time
              )}">
            </td>
            <td>
              <button class="edit-btn btn btn-sm custom-hover-btn" title="Update Schedule">
                <i class="bi bi-floppy-fill"></i>
              </button>
              <button class="delete-btn btn btn-sm custom-hover-btn" title="Delete Schedule">
                <i class="bi bi-trash-fill"></i>
              </button>
            </td>
          </tr>
        `;
      });
      tableHTML += `</tbody></table>`;
      document.querySelector(".work-schedules-card").innerHTML = tableHTML;
    })
    .catch((err) => console.error("Error fetching schedules:", err));
}

document.addEventListener("DOMContentLoaded", async function () {
  // Wait for content load
  waitUntilReady(fetchSchedules);
});
