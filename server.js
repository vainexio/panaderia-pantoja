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
    name: String,
    availability: String,
    amount: Number,
    price: Number,
  });
  
  stocks = mongoose.model('Stock', stockSchema);
  orderSchema = new mongoose.Schema({
    itemName: String,
    description: String,
    orderStatus: String,
    price: Number,
  });
  orders = mongoose.model('Order', orderSchema);
}

startDatabase();

//App
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//REQUESTS

//Order
app.post('/user/order', async (req, res) => {
  let { itemName, description, price } = req.body
  let doc = new orders(orderSchema)
  doc.itemName = itemName
  doc.description = description
  doc.price = price
  await doc.save();
  res.redirect('/')
});

//Admin
app.get('/admin', async (req, res) => {
  const s = await stocks.find();
  const o = await orders.find();
  res.sendFile(__dirname + '/public/admin.html');
});
//Add stocks
app.post('/admin/addStock', async (req, res) => {
  const { name, availability, amount, price } = req.body;
  let doc = new stocks(stockSchema)
  doc.name = name
  doc.availability = availability
  doc.amount = amount
  doc.price = price
  console.log('this',req.body)
  await doc.save();
  
  res.redirect('/admin');
});
app.get('/admin/getStocks', async (req, res) => {
  let doc = await stocks.find();
  console.log(doc)
  res.send(doc).status(200)
  //res.redirect('/admin');
});

process.on('unhandledRejection', async error => {
  console.log(error);
});
