const fetch = require('node-fetch');


function generateSecurityKey(length = 32) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";

    for (let i = 0; i < length; i++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
}
function sleep(miliseconds) {
    var currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) { }
}

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
function checkIfOnDuty(availability) {
  const availDayIndex = dayOfWeekMap[availability.day_of_week];

  const dateNow = timezone();
  const currentDayIndex = dateNow.getDay();
  const currentTime24 = dateNow.getHours() + dateNow.getMinutes() / 60;

  const start = parseTimeTo24(availability.start_time); // "7:00 AM" is 7
  const end = parseTimeTo24(availability.end_time);     // "10:00 PM" is 22

  console.log(`Date Now: dayIndex=${currentDayIndex}, time=${currentTime24}`);
  console.log(`Availability: dayIndex=${availDayIndex}, start=${start}, end=${end}`);

  const isSameDay = currentDayIndex === availDayIndex;
  const isInTimeRange = currentTime24 >= start && currentTime24 <= end;

  return isSameDay && isInTimeRange;
}

function computeCalendarWeeks(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  let week = new Array(7).fill('');
  let startDay = firstDay.getDay();
  let dayCounter = 1;

  for (let i = startDay; i < 7; i++) {
    week[i] = dayCounter++;
  }
  weeks.push(week);

  while (dayCounter <= lastDay.getDate()) {
    week = new Array(7).fill('');
    for (let i = 0; i < 7 && dayCounter <= lastDay.getDate(); i++) {
      week[i] = dayCounter++;
    }
    weeks.push(week);
  }
  return weeks;
}
module.exports = {
  sleep,
  generateSecurityKey,
  checkIfOnDuty,
  computeCalendarWeeks
}