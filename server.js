//Glitch Project
const express = require('express');
const https = require('https');
const app = express();
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const moment = require('moment')
const bodyParser = require('body-parser')
const fs = require('fs')
//
let listener = app.listen(process.env.PORT, function() {
   console.log('Not that it matters but your app is listening on port ' + listener.address().port);
});
//LOG VARIABLES
const { settings } = require('./storage/settings_.js')

//Models and Schema
let stockSchema
let stocks
let orderSchema
let orders
let notifSchema
let notif
//Database
async function startDatabase() {
  await mongoose.connect(process.env.MONGOOSE);
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  
  // Define MongoDB schemas and models
  stockSchema = new mongoose.Schema({
    itemName: String,
    availability: String,
    amount: Number,
    price: Number,
    id: Number,
  });
  notifSchema = new mongoose.Schema({
    id: Number,
    text: String,
  });
  notif = mongoose.model('Notifs1', notifSchema);
  stocks = mongoose.model('Stock5', stockSchema);
  orderSchema = new mongoose.Schema({
    itemName: String,
    description: String,
    amount: Number,
    orderStatus: String,
    price: Number,
    id: Number,
  });
  orders = mongoose.model('Order5', orderSchema);
}
async function sendNotif(text) {
  let doc = new notif(notifSchema)
  doc.text = text
  doc.id = Math.floor((Math.random() * 10000000) + 1)
  await doc.save();
} 
startDatabase();

//App
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//Handle Notif
app.get('/notifs', async (req, res) => {
  let notifications = await notif.find()
  console.log(notifications)
  let pending = []
  for (let i in notifications) {
      pending.push(notifications[i].text)
  }
  await res.send({pending: pending});
  for (let i in notifications) {
    await notif.deleteOne({id: notifications[i].id})
  }
})
//Order
app.post('/order', async (req, res) => {
  let { client, itemName, description, amount } = req.body
      
      let doc = new orders(orderSchema)
      doc.itemName = itemName.toLowerCase()
      doc.description = description
      doc.orderStatus = 'pending'
      doc.amount = amount
      doc.id = Math.floor((Math.random() * 1000000) + 1)
  
      await doc.save();
      await sendNotif("✅ PO was placed")
  res.redirect('/')
});

//Admin
app.get('/dashboard', async (req, res) => {
  const s = await stocks.find();
  const o = await orders.find();
  res.sendFile(__dirname + '/public/dashboard.html');
});
//Add stocks
app.post('/dashboard/addStocks', async (req, res) => {
  const { stockName, availability, amount, price } = req.body;
  let existing = await stocks.findOne({itemName: stockName.toLowerCase()})
  if (existing) {
    existing.amount = amount
    existing.price = price
    existing.availability = availability
    await existing.save();
    sendNotif("✅ Updated Existing Stock")
  } else {
    let doc = new stocks(stockSchema)
    doc.itemName = stockName.toLowerCase()
    doc.availability = availability
    doc.amount = amount
    doc.price = price
    doc.id = Math.floor((Math.random() * 1000000) + 1)
    await doc.save();
    sendNotif("📥 New Stock Added")
  }
  res.redirect('/dashboard');
});
app.post('/dashboard/updateStock', async (req, res) => {
  if (req.query.delete) {
    await stocks.deleteOne({id: req.query.delete})
    sendNotif("Deleted Stock")
  } else {
    const { status, amount } = req.body;
    let args = status.trim().split(/,/)
    let doc = await stocks.findOne({id: args[1]})
    if (doc) {
      if (args[0] === 'out of stock') {
        doc.availability = args[0]
        doc.amount = 0
        await doc.save();
      } else {
        doc.availability = args[0]
        doc.amount = amount
        await doc.save();
      }
      sendNotif("📤 Stock Updated")
    } else {
      sendNotif("⚠️ Unknown data")
    }
  }
  
  res.redirect('/');
});
app.post('/dashboard/updateOrder', async (req, res) => {
  if (req.query.delete) {
    await orders.deleteOne({id: req.query.delete})
    sendNotif("🗑️ Order Deleted")
  } else {
    const { status } = req.body;
    let args = status.trim().split(/\n| /)
    let doc = await orders.findOne({id: args[1]})
    if (doc) {
      doc.orderStatus = args[0]
      await doc.save();
      sendNotif("✅ Order Updated")
    }
  }
  
  res.redirect('/dashboard');
});
app.get('/dashboard/getPendingOrders', async (req, res) => {
  let doc = await orders.find();
  res.send(doc).status(200)
  //res.redirect('/admin');
});
app.get('/dashboard/getOrders', async (req, res) => {
  let doc = await orders.find();
  res.send(doc).status(200)
  //res.redirect('/admin');
});

process.on('unhandledRejection', async error => {
  console.log(error);
});
