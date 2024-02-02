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
// Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
  // Implement dashboard logic here
});

// Stocks
app.get('/stocks', (req, res) => {
  // Implement stocks logic here
});

app.post('/stocks', (req, res) => {
  // Implement adding stocks logic here
});

// Orders
app.get('/orders', (req, res) => {
  // Implement orders logic here
});

app.post('/orders', (req, res) => {
  // Implement placing orders logic here
});

// Pending Orders (Admin)
app.get('/admin/pending-orders', (req, res) => {
  // Implement pending orders logic here
});

app.put('/admin/pending-orders/:orderId', (req, res) => {
  // Implement updating order status logic here
});

process.on('unhandledRejection', async error => {
  console.log(error);
});
