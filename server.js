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

//Database
mongoose.connect(process.env.MONGOOSE, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define MongoDB schemas and models
const stockSchema = new mongoose.Schema({
    name: String,
    availability: String,
    amount: Number,
    price: Number,
});

const Stock = mongoose.model('Stock', stockSchema);

const orderSchema = new mongoose.Schema({
    itemName: String,
    description: String,
    orderStatus: String,
    price: Number,
});

const Order = mongoose.model('Order', orderSchema);

//App
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});


// Handle stock configuration and addition
app.post('/configure-stock', async (req, res) => {
    try {
        const { name, availability, amount, price } = req.body;
        const newStock = new Stock({ name, availability, amount, price });
        await newStock.save();
        res.redirect('/admin#stocks');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle order placement
app.post('/place-order', async (req, res) => {
    try {
        const { itemName, description, price } = req.body;
        const newOrder = new Order({ itemName, description, orderStatus: 'Pending', price });
        await newOrder.save();
        res.redirect('/#orders');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Retrieve stocks from the database
app.get('/get-stocks', async (req, res) => {
    try {
        const stocks = await Stock.find();
        res.json(stocks);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Retrieve pending orders from the database
app.get('/get-pending-orders', async (req, res) => {
    try {
        const pendingOrders = await Order.find({ orderStatus: 'Pending' });
        res.json(pendingOrders);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

process.on('unhandledRejection', async error => {
  console.log(error);
});
