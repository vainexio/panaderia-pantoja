//Glitch Project
const express = require('express');
const https = require('https');
const app = express();
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const moment = require('moment')
const bodyParser = require('body-parser')
//
let listener = app.listen(process.env.PORT, function() {
   console.log('Not that it matters but your app is listening on port ' + listener.address().port);
});
//LOG VARIABLES
var output = "901759430457167872";
const { settings } = require('./storage/settings_.js')

//Models and Schema
let stockSchema
let stocks
let orderSchema
let orders
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
  
  stocks = mongoose.model('Stock5', stockSchema);
  orderSchema = new mongoose.Schema({
    client: String,
    itemName: String,
    description: String,
    amount: Number,
    orderStatus: String,
    price: Number,
    id: Number,
  });
  orders = mongoose.model('Order5', orderSchema);
}

startDatabase();

//App
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//REQUESTS

//Order
app.post('/order', async (req, res) => {
  let { client, itemName, description, amount } = req.body
  console.log(req.body)
  
  let item = await stocks.findOne({itemName: itemName})
  if (item) {
    if (item.amount >= amount) {
      item.amount -= amount
      
      let doc = new orders(orderSchema)
      doc.client = client
      doc.itemName = itemName
      doc.description = description
      doc.orderStatus = 'pending'
      doc.amount = amount
      doc.price = item.price
      doc.id = Math.floor((Math.random() * 1000000) + 1)
      
      if (item.amount === 0) {
        item.availability = "Out of Stock"
      }
      await item.save();
      await doc.save();
    } else {
      //not enough stocks
    }
  }
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
  let doc = new stocks(stockSchema)
  doc.itemName = stockName
  doc.availability = availability
  doc.amount = amount
  doc.price = price
  doc.id = Math.floor((Math.random() * 1000000) + 1)
  await doc.save();
  
  res.redirect('/dashboard');
});
app.post('/dashboard/updateStock', async (req, res) => {
  const { status } = req.body;
  let args = status.trim().split(/,/)
  let doc = await stocks.findOne({id: args[1]})
  if (doc) {
    console.log(args)
    if (args[0] === 'delete') {
      await stocks.deleteOne({id: args[1]})
    }
    else if (args[0] === 'out of stock') {
      doc.availability = args[0]
      doc.amount = 0
      await doc.save();
    } else {
      doc.availability = args[0]
      await doc.save();
    }
  }
  
  res.redirect('/');
});
app.post('/dashboard/updateOrder', async (req, res) => {
  console.log(req.body)
  const { status } = req.body;
  let args = status.trim().split(/\n| /)
  let doc = await orders.findOne({id: args[1]})
  if (doc) {
    doc.orderStatus = args[0]
    await doc.save();
  }
  
  res.redirect('/dashboard');
});
app.get('/dashboard/getStocks', async (req, res) => {
  let doc = await stocks.find();
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
