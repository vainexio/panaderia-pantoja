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
let Stock
let orderSchema
let Order
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
  
  Stock = mongoose.model('Stock', stockSchema);
  orderSchema = new mongoose.Schema({
    itemName: String,
    description: String,
    orderStatus: String,
    price: Number,
  });
  Order = mongoose.model('Order', orderSchema);
}

startDatabase();

//App
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});


app.get('/admin', async (req, res) => {
  const stocks = await Stock.find();
  const orders = await Order.find();
  res.sendFile(__dirname + '/views/admin.html');
});

app.post('/admin/addStock', async (req, res) => {
  const { name, availability, amount, price } = req.body;
  await Stock.create({ name, availability, amount, price });
  res.redirect('/admin');
});

app.post('/user/order', async (req, res) => {
  const { itemName, description, price } = req.body;
  await Order.create({ itemName, description, orderStatus: 'Pending', price });
  res.redirect('/');
});

process.on('unhandledRejection', async error => {
  console.log(error);
});
