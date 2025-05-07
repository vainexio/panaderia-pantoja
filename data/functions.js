const fetch = require('node-fetch')
const fs = require('fs')
const { execSync } = require("child_process");
//////
function setOuterBorder(sheet, startRow, endRow, startCol, endCol) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = sheet.getCell(r, c);
      const outer = {};
      if (r === startRow) outer.top = { style: 'thick' };
      if (r === endRow)   outer.bottom = { style: 'thick' };
      if (c === startCol) outer.left = { style: 'thick' };
      if (c === endCol)   outer.right = { style: 'thick' };
      cell.border = { ...cell.border, ...outer };
    }
  }
}
function sleep(miliseconds) {
    var currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) { }
}
function genId(length = 32) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";

    for (let i = 0; i < length; i++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
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
function convertTo12Hour(time) {
  const [hourStr, minute] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour = hour - 12;
  }
  
  return `${hour}:${minute} ${period}`;
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
  genId,
  checkIfOnDuty,
  computeCalendarWeeks,
  convertTo12Hour,
  setOuterBorder,
  generateQr: async function(text) {
    
    let data2 = {
      method: 'POST',
      body: JSON.stringify({"data":text,"config":{"body":"square","eye":"frame0","eyeBall":"ball0","erf1":[],"erf2":[],"erf3":[],"brf1":[],"brf2":[],"brf3":[],"bodyColor":"#000000","bgColor":null,"eye1Color":"#000000","eye2Color":"#000000","eye3Color":"#000000","eyeBall1Color":"#000000","eyeBall2Color":"#000000","eyeBall3Color":"#000000","gradientColor1":"","gradientColor2":"","gradientType":"linear","gradientOnEyes":"true","logo":"","logoMode":"default"},"size":800,"download":"imageUrl","file":"png"}),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    let data = {
      method: 'POST',
      body: JSON.stringify({"data":text,"config":{"body":"square","eye":"frame0","eyeBall":"ball0","erf1":[],"erf2":[],"erf3":[],"brf1":[],"brf2":[],"brf3":[],"bodyColor":"#000000","bgColor":"#FFFFFF","eye1Color":"#000000","eye2Color":"#000000","eye3Color":"#000000","eyeBall1Color":"#000000","eyeBall2Color":"#000000","eyeBall3Color":"#000000","gradientColor1":null,"gradientColor2":null,"gradientType":"linear","gradientOnEyes":false,"logo":"","logoMode":"default"},"size":800,"download":"imageUrl","file":"png"}),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    let qrCode = await fetch("https://api.qrcode-monkey.com//qr/custom", data);
    console.log(qrCode.status,qrCode.statusText)
    qrCode = await qrCode.json();
    console.log(qrCode)
    let imageUrl = "https:" + qrCode.imageUrl;
    
    return {imageUrl, raw: text};
  }
}