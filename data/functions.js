const fetch = require('node-fetch');
// Map day_of_week strings to numeric indexes (Sunday = 0, Monday = 1, etc.)
const dayOfWeekMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

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
  const now = new Date();
  const hours = now.getHours();     // 0..23
  const minutes = now.getMinutes(); // 0..59
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
  // Determine the numeric index for the availability’s day_of_week (e.g., Monday => 1)
  const availDayIndex = dayOfWeekMap[availability.day_of_week];

  // Get the current server day/time in decimal hour format
  const now = new Date();
  const currentDayIndex = now.getDay(); // Sunday=0, Monday=1, etc.
  const currentTime24 = getCurrentTime24();

  // Parse the availability’s start and end times into decimal hour format
  const start = parseTimeTo24(availability.start_time); // e.g., "7:00 AM" => 7
  const end = parseTimeTo24(availability.end_time);     // e.g., "10:00 AM" => 10

  // Doctor is on duty if today is the availability’s day_of_week
  // and the current time is within [start, end)
  const isSameDay = currentDayIndex === availDayIndex;
  const isInTimeRange = currentTime24 >= start && currentTime24 < end;

  return isSameDay && isInTimeRange;
}
}