document.addEventListener("DOMContentLoaded", async function () {
  function isReady() {
    fetch("/api/clinic-schedule")
      .then((response) => response.json())
      .then((data) => {
        let monthDisplay = document.getElementById("monthDisplay");
        monthDisplay.textContent = data.currentMonth + " " + data.currentYear;

        const calendarBody = document.getElementById("calendarBody");
        const todayDate = new Date().getDate();
        const reverseDayOfWeekMap = Object.entries(dayOfWeekMap).reduce(
          (acc, [day, num]) => {
            acc[num] = day;
            return acc;
          },
          {}
        );

        const todayName = reverseDayOfWeekMap[new Date().getDay()];
        console.log(todayName);

        data.weeks.forEach((week) => {
          const tr = document.createElement("tr");
          week.forEach((day) => {
            const td = document.createElement("td");
            td.id = "day-" + day;
            if (day > 0) {
              const div = document.createElement("div");
              div.classList.add("day");
              if (day === todayDate) {
                div.classList.add("today");
                div.textContent = day;
                td.appendChild(div);
              } else {
                div.textContent = day;
                td.appendChild(div);
              }
            }
            tr.appendChild(td);
          });
          calendarBody.appendChild(tr);
        });

        const availabilityContainer = document.getElementById(
          "availabilityContainer"
        );
        availabilityContainer.innerHTML = "";

        data.doctorAvailabilities.forEach((item) => {
          const doctorDiv = document.createElement("div");
          doctorDiv.className = "availabilityItem";
          doctorDiv.id = "availability-" + item.doctor_id;

          const timeSlot = document.createElement("div");
          timeSlot.id = "timeSlot";
          const statusSlot = document.createElement("div");
          statusSlot.id = "statusSlot";
          timeSlot.appendChild(statusSlot);

          const overallOnDuty = item.availabilities.some((slot) => slot.onDuty);
          const statusDot = document.createElement("span");
          statusDot.id = "statusDot";
          statusDot.className = overallOnDuty ? "on-duty" : "off-duty";
          statusSlot.appendChild(statusDot);

          const doctorName = document.createElement("h3");
          doctorName.id = "doctorName";
          doctorName.textContent =
            "Dr. " + item.doctor.first_name + " " + item.doctor.last_name;
          statusSlot.appendChild(doctorName);

          const statusText = document.createElement("span");
          statusText.id = "statusText";
          statusText.textContent = overallOnDuty ? "• On-duty" : "• Off-duty";
          statusSlot.appendChild(statusText);

          item.availabilities.forEach((slot) => {
            let classColor = "time-color";
            console.log(todayName, slot.day_of_week);
            if (todayName == slot.day_of_week) classColor = "time-today";
            const slotInfo = document.createElement("div");
            slotInfo.innerHTML = `<span id="timeRange" class="${classColor}">${slot.start_time} - ${slot.end_time}</span> 
                                <span id="dayAvailable">${slot.day_of_week}</span>`;
            timeSlot.appendChild(slotInfo);
          });

          // Book Appointment button
          const actionsSlot = document.createElement("div");
          actionsSlot.id = "actionsSlot";

          const bookButton = document.createElement("button");
          bookButton.id = "bookAppointment";
          bookButton.textContent = "Book Appointment";
          bookButton.classList.add("action-button");
          if (!overallOnDuty) bookButton.disabled = true;
          bookButton.addEventListener("click", function () {
            bookAppointment(item.doctor_id);
          });
          actionsSlot.appendChild(bookButton);
          doctorDiv.appendChild(timeSlot);
          doctorDiv.appendChild(actionsSlot);

          availabilityContainer.appendChild(doctorDiv);
        });
      })
      .catch((error) => {
        console.error("Error fetching schedule data:", error);
      });
  }

  // Wait for content load
  waitUntilReady(isReady);
});

const dayOfWeekMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function bookAppointment(doctorId) {
  showSection("my_appointments");
}