document.addEventListener("DOMContentLoaded", async function() {
  function isReady() {
    fetch('/api/clinic-schedule')
  .then(response => response.json())
  .then(data => {
    // Update the month/year header as before
    document.getElementById('monthDisplay').textContent =
      data.currentMonth + " " + data.currentYear;

    // Build the calendar table (unchanged)
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

    // Process grouped doctor availabilities
    const availabilityContainer = document.getElementById('availabilityContainer');
    availabilityContainer.innerHTML = ''; // Clear any existing content

    data.doctorAvailabilities.forEach(item => {
      // Create a container for this doctor (we keep the element ids as given)
      const doctorDiv = document.createElement('div');
      doctorDiv.className = 'availabilityItem';
      doctorDiv.id = 'availability-' + item.doctor_id; // Using doctor_id here

      // Create the time slot container (same id as before)
      const timeSlot = document.createElement('div');
      timeSlot.id = 'timeSlot';
      const statusSlot = document.createElement('div');
      statusSlot.id = 'statusSlot';
      timeSlot.appendChild(statusSlot);
      
      //Dot
      const overallOnDuty = item.availabilities.some(slot => slot.onDuty);
      const statusDot = document.createElement('span');
      statusDot.id = 'statusDot';
      statusDot.className = overallOnDuty ? 'on-duty' : 'off-duty';
      statusSlot.appendChild(statusDot);
      
      const doctorName = document.createElement('h3');
      doctorName.id = 'doctorName';
      doctorName.textContent = "Dr. "+item.doctor.first_name + " " + item.doctor.last_name;
      statusSlot.appendChild(doctorName);

      const statusText = document.createElement('span');
      statusText.id = 'statusText';
      statusText.textContent = overallOnDuty ? '• On-duty' : '• Off-duty';
      statusSlot.appendChild(statusText);

      item.availabilities.forEach(slot => {
        const slotInfo = document.createElement('div');
        
        slotInfo.innerHTML = `<span id="timeRange">${slot.start_time} - ${slot.end_time}</span> 
                              <span id="dayAvailable">${slot.day_of_week}</span>`;
        timeSlot.appendChild(slotInfo);
      });
      
      // Book Appointment button
      const actionsSlot = document.createElement('div');
      actionsSlot.id = 'actionsSlot';
      
      const bookButton = document.createElement('button');
      bookButton.id = 'bookAppointment';
      bookButton.textContent = 'Book Appointment';
      bookButton.addEventListener('click', function() {
        bookAppointment(item.doctor_id);
      });
      actionsSlot.appendChild(bookButton)
      doctorDiv.appendChild(timeSlot);
      doctorDiv.appendChild(actionsSlot);
      
      availabilityContainer.appendChild(doctorDiv);
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
