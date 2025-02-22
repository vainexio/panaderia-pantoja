const fetch = require('node-fetch');

const dayOfWeekMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};
function timezone() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
}

function parseTimeTo24(timeStr) {
  const [timePart, ampm] = timeStr.split(' ');
  const [hourStr, minuteStr] = timePart.split(':');

  let hour = parseInt(hourStr, 10);
  let minute = parseInt(minuteStr, 10) || 0;

  // Convert to 24-hour
  if (ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return hour + minute / 60;
}

function getCurrentTime24() {
  const timezone = timezone();
  const hours = timezone.getHours();
  const minutes = timezone.getMinutes();
  return hours + minutes / 60;
}
module.exports = {
  sleep: function (miliseconds) {
    var currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) { }
  },
  generateSecurityKey: function (length = 32) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";

    for (let i = 0; i < length; i++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
  },
  checkIfOnDuty: function (availability) {
  const availDayIndex = dayOfWeekMap[availability.day_of_week];

  const dateNow = timezone();
  const currentDayIndex = dateNow.getDay();
  const currentTime24 = dateNow.getHours() + dateNow.getMinutes() / 60;

  const start = parseTimeTo24(availability.start_time); // e.g. "7:00 AM" => 7
  const end = parseTimeTo24(availability.end_time);     // e.g. "10:00 PM" => 22

  // Logging for debugging
  console.log(`Shanghai Now: dayIndex=${currentDayIndex}, time=${currentTime24}`);
  console.log(`Availability: dayIndex=${availDayIndex}, start=${start}, end=${end}`);

  const isSameDay = currentDayIndex === availDayIndex;
  const isInTimeRange = currentTime24 >= start && currentTime24 <= end;

  return isSameDay && isInTimeRange;
}

}