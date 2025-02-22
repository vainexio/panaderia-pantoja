const dayOfWeekMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};



document.addEventListener("DOMContentLoaded", async function() {
  function isReady() {
    fetch('/api/clinic-schedule')
    .then(response => response.json())
    .then(data => {
      // 1. Update month and year
      document.getElementById('monthDisplay').textContent =
        `${data.currentMonth} ${data.currentYear}`;

      // 2. Build the calendar
      renderCalendar(data.weeks);

      // 3. Build the availability list
      //    We'll compute "onDuty" on the client side by checking current day/time.
      renderAvailability(data.doctorAvailabilities);
    })
    .catch(error => console.error('Error fetching schedule data:', error));
  }
  
  // Wait for content load
  waitUntilReady(isReady)
})

// Renders the calendar into #calendarBody
function renderCalendar(weeks) {
  const calendarBody = document.getElementById('calendarBody');
  // Clear existing rows if any
  calendarBody.innerHTML = '';

  weeks.forEach((week, rowIndex) => {
    const tr = document.createElement('tr');

    week.forEach((day, colIndex) => {
      const td = document.createElement('td');
      td.textContent = day > 0 ? day : ''; // 0 means empty cell

      // Color code weekends vs. weekdays
      // colIndex = 0 => Sunday, colIndex = 6 => Saturday
      if (day > 0) {
        if (colIndex === 0 || colIndex === 6) {
          // Weekend
          td.style.backgroundColor = '#e6c2bf';
        } else {
          // Weekday
          td.style.backgroundColor = '#efe3d4';
        }
      }

      tr.appendChild(td);
    });

    calendarBody.appendChild(tr);
  });
}

// Renders the availability items into #availabilityContainer
function renderAvailability(doctorAvailabilities) {
  const container = document.getElementById('availabilityContainer');
  container.innerHTML = '';

  // Current local day/time
  const now = new Date();
  const currentDayIndex = now.getDay(); // Sunday=0, Monday=1, etc.
  const currentTime24 = getCurrentTime24(now); // e.g., 13.5 = 1:30 PM

  doctorAvailabilities.forEach(avail => {
    // Check if the availability's day_of_week matches today's day
    const availDayIndex = dayOfWeekMap[avail.day_of_week];

    // Parse the start_time & end_time into 24-hour format
    const start = parseTimeTo24(avail.start_time); // e.g. "7:00 AM" => 7
    const end = parseTimeTo24(avail.end_time);     // e.g. "10:00 AM" => 10

    // Decide if on duty:
    // 1) same day_of_week
    // 2) currentTime24 is within [start, end)
    let onDuty = false;
    if (currentDayIndex === availDayIndex &&
        currentTime24 >= start && currentTime24 < end) {
      onDuty = true;
    }

    // Create the container for this availability
    const div = document.createElement('div');
    div.className = 'availabilityItem';

    // Time slot
    const timeSlot = document.createElement('div');
    timeSlot.id = 'timeSlot';

    // Status dot
    const statusDot = document.createElement('span');
    statusDot.id = 'statusDot';
    statusDot.className = onDuty ? 'on-duty' : 'off-duty';
    timeSlot.appendChild(statusDot);

    // Status text
    const statusText = document.createElement('span');
    statusText.id = 'statusText';
    statusText.textContent = onDuty ? 'On-duty' : 'Off-duty';
    timeSlot.appendChild(statusText);

    // Time range
    const timeRange = document.createElement('span');
    timeRange.id = 'timeRange';
    timeRange.textContent = `${avail.start_time} - ${avail.end_time}`;
    timeSlot.appendChild(timeRange);

    div.appendChild(timeSlot);

    // Doctor details
    const doctorDetails = document.createElement('div');
    doctorDetails.id = 'doctorDetails';

    const doctorName = document.createElement('h3');
    doctorName.id = 'doctorName';
    doctorName.textContent = `${avail.doctor.first_name} ${avail.doctor.last_name}`;
    doctorDetails.appendChild(doctorName);

    // Book button
    const bookBtn = document.createElement('button');
    bookBtn.id = 'bookAppointment';
    bookBtn.textContent = 'Book Appointment';
    bookBtn.onclick = () => {
      alert(`Booking appointment for doctor with ID: ${avail.doctor_id}`);
    };
    doctorDetails.appendChild(bookBtn);

    div.appendChild(doctorDetails);
    container.appendChild(div);
  });
}

// Convert current local time to a decimal hour in 24-hour format
// e.g., 1:30 PM => 13.5
function getCurrentTime24(date) {
  const hours = date.getHours();    // 0..23
  const minutes = date.getMinutes(); // 0..59
  return hours + minutes / 60;
}

// Parse a time string like "7:00 AM" or "12:30 PM" into a 24-hour decimal
// e.g., "7:00 AM" => 7, "12:00 PM" => 12, "2:30 PM" => 14.5
function parseTimeTo24(timeStr) {
  // Split into [time, AM/PM]
  const [time, ampm] = timeStr.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  
  let hour = parseInt(hourStr, 10);
  let minute = parseInt(minuteStr, 10);

  // Convert to 24-hour
  if (ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return hour + minute / 60;
}

// Separate function for booking an appointment
function bookAppointment(doctorId) {
  // Handle booking logic here (e.g., redirecting to a booking page or opening a modal)
  alert('Booking appointment for doctor with ID: ' + doctorId);
}
