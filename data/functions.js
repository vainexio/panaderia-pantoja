const fetch = require('node-fetch');
const fetch = require('node-fetch');
//Functions
const get = require('../functions/get.js')
const {getTime, chatAI2, getNth, getChannel, getGuild, getUser, getMember, getRandom, getColor} = get

const Discord = require('discord.js');
const {MessageAttachment, ActivityType, WebhookClient, Permissions, Client, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu} = Discord;

//
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
  generateQr: async function(data) {
    
    let data = {
      method: 'POST',
      body: JSON.stringify({"data":data,"config":{"body":"square","eye":"frame0","eyeBall":"ball0","erf1":[],"erf2":[],"erf3":[],"brf1":[],"brf2":[],"brf3":[],"bodyColor":"#000000","bgColor":"#FFFFFF","eye1Color":"#000000","eye2Color":"#000000","eye3Color":"#000000","eyeBall1Color":"#000000","eyeBall2Color":"#000000","eyeBall3Color":"#000000","gradientColor1":"","gradientColor2":"","gradientType":"linear","gradientOnEyes":"true","logo":"","logoMode":"default"},"size":800,"download":"imageUrl","file":"png"}),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    let qrCode = await fetch("https://api.qrcode-monkey.com//qr/custom", data);
    qrCode = await qrCode.json();
    let imageUrl = "https:" + qrCode.imageUrl;
    
    return {imageUrl, raw: generatedQr};
  }
}