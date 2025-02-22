document.addEventListener("DOMContentLoaded", async function() {
  function isReady() {
    fetch('/api/clinic-schedule')
      .then(response => response.json())
      .then(data => {
        // Update the month and year header
        document.getElementById('monthDisplay').textContent = data.currentMonth + " " + data.currentYear;

        // Build the calendar table
        const calendarBody = document.getElementById('calendarBody');
        data.weeks.forEach(week => {
          const tr = document.createElement('tr');
          week.forEach(day => {
            const td = document.createElement('td');
            td.id = 'day-' + day;
            td.textContent = day > 0 ? day : '';
            tr.appendChild(td);
          });
          calendarBody.appendChild(tr);
        });

        // Build the doctor availability list
        const availabilityContainer = document.getElementById('availabilityContainer');
        data.doctorAvailabilities.forEach(availability => {
          const div = document.createElement('div');
          div.className = 'availabilityItem';
          div.id = 'availability-' + availability.availability_id;

          // Time slot div
          const timeSlot = document.createElement('div');
          timeSlot.id = 'timeSlot';

          // Status dot
          const statusDot = document.createElement('span');
          statusDot.id = 'statusDot';
          statusDot.className = availability.onDuty ? 'on-duty' : 'off-duty';
          timeSlot.appendChild(statusDot);

          // Status text
          const statusText = document.createElement('span');
          statusText.id = 'statusText';
          statusText.textContent = availability.onDuty ? 'On-duty' : 'Off-duty';
          timeSlot.appendChild(statusText);

          // Time range
          const timeRange = document.createElement('span');
          timeRange.id = 'timeRange';
          timeRange.textContent = availability.start_time + ' - ' + availability.end_time;
          timeSlot.appendChild(timeRange);

          // Day available text
          const dayAvailable = document.createElement('span');
          dayAvailable.id = 'dayAvailable';
          dayAvailable.textContent = "Available on: " + availability.day_of_week;
          timeSlot.appendChild(dayAvailable);

          div.appendChild(timeSlot);

          // Doctor details div
          const doctorDetails = document.createElement('div');
          doctorDetails.id = 'doctorDetails';

          // Doctor name
          const doctorName = document.createElement('h3');
          doctorName.id = 'doctorName';
          doctorName.textContent = availability.doctor.first_name + " " + availability.doctor.last_name;
          doctorDetails.appendChild(doctorName);

          // Book Appointment button
          const bookButton = document.createElement('button');
          bookButton.id = 'bookAppointment';
          bookButton.textContent = 'Book Appointment';
          bookButton.addEventListener('click', function() {
            bookAppointment(availability.doctor_id);
          });
          doctorDetails.appendChild(bookButton);

          div.appendChild(doctorDetails);
          availabilityContainer.appendChild(div);
        });
      })
      .catch(error => {
        console.error('Error fetching schedule data:', error);
      });
  }
  
  // Wait for content load
  waitUntilReady(isReady)
});
const dayOfWeekMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

// Separate function for booking an appointment
function bookAppointment(doctorId) {
  showSection('my_appointments')
}
