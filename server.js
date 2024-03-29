// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const json2xls = require('json2xls');
const fs = require('fs');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost/purchase_orders', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PurchaseOrder = require('./models/PurchaseOrder.js');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public', { // assuming your scripts.js file is in the 'public' folder
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'text/javascript');
    }
  }
}));

// Routes
app.get('/purchase-orders', async (req, res) => {
  try {
    const orders = await PurchaseOrder.find();
    res.json(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Ensure that the server returns an array of orders
app.get('/purchase-orders', async (req, res) => {
  try {
    const orders = await PurchaseOrder.find();
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/purchase-orders/:id', async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/purchase-orders/:id', async (req, res) => {
  try {
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/purchase-orders/download', async (req, res) => {
  try {
    const orders = await PurchaseOrder.find();
    const xls = json2xls(orders);
    fs.writeFileSync('purchase_orders.xlsx', xls, 'binary');
    res.download('purchase_orders.xlsx');
  } catch (err) {
    res.status(500).send(err);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});